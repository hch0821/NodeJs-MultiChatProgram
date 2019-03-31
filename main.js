/*js 파일들 중 main인 파일입니다.*/
var express = require('express'); //node 확장 모듈
var http = require('http');
var app = express();
var static = require('serve-static'); //폴더를 가상으로 bind시키는 모듈
var path = require('path'); //파일 경로 설정을 위한 모듈
var bodyParser = require('body-parser'); //html에서 form이 post방식일 때 form의 내용을 parsing하는 모듈
var fs = require('fs'); //파일 시스템 모듈
var server = http.createServer(app);
var io = require('socket.io')(server); //클라이언트(html 파일)과 이벤트를 주고받을 수 있도록 하는 모듈(소켓)
var m_socket; //소켓 변수를 저장할 전역변수
var session = require('express-session')({ //로그인 정보를 저장하는 세션
        secret: 'my-secret',
        resave: true,
        saveUninitialized: true
    }),
    sharedsession = require('express-socket.io-session'); //세션을 라우터 뿐만아니라 socket.on(connection) 이벤트 핸들러에서도 사용할 수 있게 하는 모듈
var errorHandler = require('errorhandler'); // 에러 핸들러 모듈 사용
var expressErrorHandler = require('express-error-handler');

var userManager = require('./userManager.js'); //사용자 로그인, 사용자 정보를 세션에 등록하는 모듈
var chatManager = require('./chatManager.js'); //채팅을 관리하는 모듈
var fileManager = require('./fileManager.js'); //파일 업로드, 다운로드, 스트리밍을 관리하는 모듈
var Utils = require('./Utils.js'); //서버로그, 타임스탬프를 관리하는 모듈

var router = express.Router();

userManager.init(router, io); //모듈 초기화
fileManager.init(app, io, router); //모듈 초기화
// 기본 속성 설정
app.set('port', process.env.PORT || 3003);

//프로젝트 내의 public 폴더 가상으로 bind시킴
app.use(static(path.join(__dirname, 'public')));

//bodyParser 초기 설정
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

//세션 사용
app.use(session);

//localhost:port/로 접속시 로그인 페이지로 이동
app.get('/', function (req, res, next) {
    res.redirect('/gotosignin');
});

userManager.initRouter(); //userManager.js 안에 있는 router들을 main.js에 등록

fileManager.initFileRouter(); //fileManager.js 안에 있는 router들을 main.js에 등록
//라우터 설정 완료
app.use('/', router);

// 404 에러 페이지 처리
var errorHandler = expressErrorHandler({
    static: {
        '404': __dirname + '/public/error.html'
    }
});
app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//서버가 연결되었을 시
server.listen(app.get('port'), function (req, res) {
    console.log('서버 연결됨 : ' + app.get('port'));
    Utils.logger.info('채팅 서버 연결됨/ 포트 번호: ' + app.get('port'));
    userManager.checkDBServer(); //MySQL 서버가 가동중이지 않으면 서버를 작동.
});
//sharedsession: socket.io와 세션을 연결-->미들웨어 뿐만 아니라 socket.io에서도 세션에 접근, 수정할 수 있게 한다.
io.use(sharedsession(session, {
    autoSave: true
}));
//클라이언트(main.html,sign_in.html, sign_up.html)가 서버에 연결되었을 시 호출됨.
io.on('connection', function (socket) {
    if (m_socket == undefined) {
        m_socket = socket;
    }
    userManager.initUserSocket(socket); //userManager.js안에 있는 socket 이벤트 핸들러들을 main.js에 등록
    chatManager.initChatSocket(socket, io); //chatManager.js안에 있는 socket 이벤트 핸들러들을 main.js에 등록
    fileManager.initFileSocket(socket); //fileManager.js안에 있는 socket 이벤트 핸들러들을 main.js에 등록
});
//console 함수들 무효화
//console.dir = function () {};
//console.log = function () {};
