/*MySQL 서버에 연결, 데이터 베이스 쿼리 수행을 하는 모듈입니다.*/
var mysql = require('sync-mysql');
var fs = require('fs');
var con;
var Utils = require('./Utils');
//mysql 연결
exports.connectToChatDB = function () 
{
        con = new mysql({
            host: '127.0.0.1',
            user: 'root',
            password: 'root',
            database: '',
            multipleStatements: true //쿼리문 여러개 실행 가능
        });
        console.log('MySQL 서버와 연결하였습니다!');
        Utils.logger.info('MySQL 서버에 연결함');
};

//mysql에 연결되어있는지 확인
exports.chatDbServerConnected = function(){
  if(con == undefined){return false;}
    else{return true;}
};

//user테이블, chat 테이블, chatlog 테이블 생성
exports.createChatSchema = function () {
    var sql = fs.readFileSync(__dirname + '/chatDBSQL.sql').toString();
    var result = con.query(sql);
    console.log('result : ' + JSON.stringify(result));
};

//아이디 중복 확인
exports.checkDupId = function (userid) {
    var result = con.query("SELECT * from user where userid = " + "'" + userid + "'");
    var rows = JSON.parse(JSON.stringify(result));
    console.log('result : ' + rows);
    if (rows == "") {
        console.log('사용 가능한 아이디--dbExecute.js');
        return true;
    } else {
        console.log('이미 사용중인 아이디--dbExecute.js');
        return false;
    }

};

//닉네임 중복 확인
exports.checkDupNickname = function (userNickname) {
    var result = con.query("SELECT * from user where nickname = " + "'" + userNickname + "'");

    var rows = JSON.parse(JSON.stringify(result));

    console.log('result : ' + rows);
    if (rows == "") {
        console.log('사용 가능한 닉네임입니다!');
        return true;
    } else {
        console.log('이미 사용중인 닉네임입니다!');
        return false;
    }
};

//사용자 회원가입
exports.addUser = function (userId, userNickname, userPassword) {

    var result = con.query("INSERT INTO user (userid, nickname, password) VALUES(" +
        "'" + userId + "'" + ", " + "'" + userNickname + "'" + ", " + "'" + userPassword + "'" + ");");

    var rows = JSON.parse(JSON.stringify(result));
    console.log('result : ' + rows);
    if (rows == "") {
        console.log('회원 가입 실패!');
        return false;
    } else {
      console.log('회원 가입 성공!');
        return true;
    }
};

//로그인
exports.checkUser = function(userId, userPassword) {
    var result = con.query("SELECT nickname FROM user where userid = " + "'" + userId + "' AND password = " + "'" + userPassword +"';");
    var rows = JSON.parse(JSON.stringify(result));
    if (rows == "") {
        console.log('로그인 실패!');
        return undefined;
    } else {
        var nickname = result[0].nickname;
      console.log('로그인 성공 : ' + nickname);
        
        return nickname;
    }
};
//콘솔 함수 무효화
console.dir= function(){};
console.log = function() {};