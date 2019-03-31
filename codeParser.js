/*자바스크립트 코드를 정규 표현식을 이용해 코드의 색깔을 span 태그로 구분해주는 모듈입니다*/

//코드를 파싱하여 span 태그를 이용해 색을 구분하는 함수
exports.parseCode = function (code) {
    
    //최종으로 보내질 string
    var result = '<br><div style="background-color:rgb(50, 50, 50);color:lightgray;border-radius:5px;border-style: groove;-ms-word-break: break-all;word-break: break-all;overflow:scroll;width:80%;height:500px;"><pre><code>';
    
    //색깔 구분
    
    code = setStyle(code, 'ignore html tag');//html 태그 무시
    code = setStyle(code, 'command',
        'function', 'if', 'else', 'while', 'for', 'switch', 'true', 'false', 'break', 'new', 'return', 'continue'); //명령어들은 파란색으로 구분
    code = setStyle(code, 'var'); //변수들은 보라색으로 구분
    code = setStyle(code, 'include'); //객체.무엇무엇은 보라색으로 구분
    code = setStyle(code, 'double'); //실수형은 초록색으로 구분
    code = setStyle(code, 'apostrophe'); //따옴표에 묶인 것은 주황색으로 구분
    code = setStyle(code, 'comment'); //주석은 옅은 하늘색으로 구분하고 기울임 처리
    result = result.concat(code);
    result = result.concat('</code></pre></div><br>');
    return result; //파싱후 바뀐 코드 반환
}

//특정 코드의 부분을 정규표현식으로 찾아서 span으로 묶는 함수
function setStyle(code, style, ...chars) {
    console.log('style : ' + style);
    
    //명령어
    if (style == 'command') {
        for (var i = 0; i < chars.length; i++) {
            
            //정규표현식 : 빈칸들-명령어-빈칸들
            var re = new RegExp('^(( )*' + chars[i] + '( )*)');
            
            //찾은 곳을 span 태그로 묶음(색깔 지정)
            code = code.replace(new RegExp('^(( )*' + chars[i] + '( )*)', 'gmi'), '<span style="color:cornflowerblue;font-weight:bold;">' + chars[i] + ' </span>');
        }
    } 
    //html 태그 무시  
    else if (style == 'ignore html tag') {
        
        //정규표현식 : <는 &lt;로 >는 &gt;로 바꿈
        code = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");    
    }
    //따옴표
    else if (style == 'apostrophe') {
        
        //정규표현식 : '여러글자들'
        var re = /\'.*?\'/gmi;
        code = code.replace(re, function (match, group) {
            return '<span style="color:orange;">' + match + '</span>';
        });
        console.log('code: ' + code);
    } 
    //변수
    else if (style == 'var') {
        
         //정규표현식 : var [문자][_][숫자][문자][숫자]
        var re = /var ([a-zA-Z]*(_*)?[0-9]*[a-zA-Z]*[0-9]*)/gmi;
        code = code.replace(re, function (match, group) {
            var value = match.substring(4, match.length);
            return '<span style="color:cornflowerblue;font-weight:bold;">var </span><span style="color:mediumpurple;font-weight:bold;">' + value + '</span>';
        });
    } 
    //객체.무엇무엇
    else if (style == 'include') {
        
        //정규표현식 : 앞에 주석표시와 따옴표가 없을 경우 무엇무엇.무엇무엇 형식일 경우
        var re = /(^((?![\/|\'][\/]?).)*[a-zA-Z]*.?)\.([a-zA-Z]*(_*)?[0-9]*[a-zA-Z]*[0-9]*)/gmi;
        code = code.replace(re, function (match, group) {
            var class_v = match.split('.')[0];
            var value = match.split('.')[1];
            return class_v + '.<span style="color:mediumpurple;">' + value + '</span>';
        });

    } 
    //주석
    else if (style == 'comment') {
        //정규표현식 :  //여러문자들
        var re = /\/\/.*/gmi;
        code = code.replace(re, function (match, group) {
            return '<span style="color:cadetblue;font-style:oblique;">' + match + '</span>';
        });
    } 
    //실수형
    else if (style == 'double') {
        //정규표현식 :  숫자[.숫자] 
        var re = /[0-9]+(\.[0-9]+)?/gmi;
        code = code.replace(re, function (match, group) {
            return '<span style="color:forestgreen;">' + match + '</span>';
        });
    }
    return code;

}

console.dir= function(){};
console.log = function() {};