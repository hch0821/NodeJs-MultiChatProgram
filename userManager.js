/*사용자 로그인, 사용자 정보를 세션에 등록하는 모듈입니다*/

var userInfoArr = []; //세션에 저장될 사용자 정보를 임시 저장하는 배열
var router;
var io;
var shouldChangeIndex;
var m_socket;
var isSocketOn = false;
var m_id, m_nickname;

/*MySQL 서버에 연결, 데이터 베이스 쿼리 수행을 하는 모듈*/
var dbExecute = require('./dbExecute.js');
var chatManager = require('./chatManager.js');
var Utils = require('./Utils');

//모듈 초기화
exports.init = function (p_router, p_io) {
    router = p_router;
    io = p_io;
};

//main.js에 router 이벤트 핸들러 등록
exports.initRouter = function () {
    //sign_up.html의 아이디 중복 확인 수행
    router.route('/idDup').post(function (req, res) {
        console.log('/idDup 라우팅 함수 호출됨');
        var paramId = req.body.id;
        console.log('요청 파라미터: ' + paramId);
        var isValidId = dbExecute.checkDupId(paramId);

        m_socket.emit('valid id result', isValidId);

        res.send('<script>window.close();</script>');
    });

    //sign_up.html의 닉네임 중복 확인 수행
    router.route('/nickDup').post(function (req, res) {
        console.log('/nickDup 라우팅 함수 호출됨');
        var paramNickname = req.body.nickname;
        console.log('요청 파라미터: ' + paramNickname);
        var isValidNickname = dbExecute.checkDupNickname(paramNickname);

        m_socket.emit('valid nickname result', isValidNickname);

        res.send('<script>window.close();</script>');
    });

    //sign_up.html의 회원 가입(add user) 수행
    router.route('/signup').post(function (req, res) {
        console.log('/signup 라우팅 함수 호출됨');
        var param = req.body.idnickpwd;
        console.log(req.body);
        console.log('요청 파라미터: ' + param);
        var splittedInfo = param.split(';');
        console.log(splittedInfo);
        var id = splittedInfo[0];
        var nickname = splittedInfo[1];
        var password = splittedInfo[2];
        var success = dbExecute.addUser(id, nickname, password);
        Utils.logger.info('사용자 회원 가입 시도 : ' + id + '/ 가입 성공 여부 :' + success);
        m_socket.emit('sign up', success);
        res.redirect('/sign_in.html');
    });

    //sign_in.html의 로그인 수행
    router.route('/signin').post(function (req, res) {
        console.log('/signin 라우팅 함수 호출됨');
        var paramId = req.body.id;

        var paramPassword = req.body.password;
        m_id = paramId;
        console.log('요청 파라미터: ' + paramId + ', ' + paramPassword);
        var nickname = dbExecute.checkUser(paramId, paramPassword);
        //var nickname = paramId;
        m_nickname = nickname;
        if (nickname != undefined) {
            res.redirect('/chat');
            Utils.logger.info('사용자 로그인--아이디: ' + paramId + ", 닉네임: " + nickname);
        } else {
            Utils.logger.error('로그인 실패: ' + paramId + ' (아이디 또는 비밀번호 불일치)');
            res.sendFile(__dirname + '/public/sign_in_fail.html');
        }

    });

    //sign_in.html의 로그아웃 수행
    router.route('/signout').post(function (req, res) {
        console.log('/signout 라우팅 함수 호출됨');
        var paramNickname = req.body.curNickname;
        console.log('요청 파라미터: ' + paramNickname);
        if (req.session.user) {
            console.log('로그아웃 합니다 : ');

            Utils.logger.info('사용자 로그아웃 : ' + paramNickname);

            chatManager.leaveRoomByNickname(m_socket, paramNickname);

            //로그아웃 한 사용자를 세션에서 제거함.
            if (req.session.user != undefined) {
                console.log('req.session.user.length: ' + req.session.user.length);
                for (var i = 0; i < req.session.user.length; i++) {
                    if (req.session.user[i].nickname == paramNickname) {
                        userInfoArr.splice(i, 1);
                        req.session.user = userInfoArr;
                        req.session.save(function () {
                            console.log('/signout 라우팅 함수에서 session 수정됨');
                        });
                        break;
                    }
                }
                console.log('현재 세션 정보 : ');
                console.dir(req.session.user);

                //접속된 사용자 목록 갱신(브로드캐스트--모든 클라이언트의 사용자 목록 갱신)
                try { //모든 사용자가 나가버리면 socket이 undefined 상태가 되므로 예외 처리 해야함.
                    io.sockets.emit('update user list', req.session);
                } catch (e) {
                    console.log(e.message);
                }

                res.redirect('/gotosignin');
            } else {
                console.log('아무도 로그인되어 있지 않습니다.');
                res.redirect('/gotosignin');
            }
        }
    });

    //sign_in.html의 로그인 페이지로 이동 수행
    router.route('/gotosignIn').get(function (req, res) {
        res.redirect('/sign_in.html');
    });

    //sign_in.html의 회원가입 페이지로 이동 수행
    router.route('/gotosignup').get(function (req, res) {
        res.redirect('/sign_up.html');
    });

    //sign_in.html의 채팅 페이지로 이동 수행
    router.route('/chat').get(function (req, res) {
        console.log('/chat 라우팅 함수 호출됨.');
        res.redirect('/main.html');
    });

    router.route('/wrong_access').get(function (req, res) {
        Utils.logger.error('잘못된 접근 -- 접근 거부 완료');
        res.redirect('/wrong_access.html');
    });
};

//main.js의 socket.on('connection') 이벤트 때 등록될 소켓 이벤트 핸들러들
exports.initUserSocket = function (socket) {
    //main.html의 $(document).ready가 수행될 시 client is ready 이벤트 보내짐
    m_socket = socket;
    console.log('initSocket:' + socket.id);
    socket.on('client is ready', function () {
        isSocketOn = true;
        console.log('client is ready');
        console.log('현재 로그인한 socketid : ' + socket.id);
        var alreadySignin = false;
        console.log('userInfoArr에 user 등록 : id : ' + m_id + ', nickname : ' + m_nickname);
        if (m_id == undefined || m_nickname == undefined) {
            socket.emit('wrong access');
            console.log('잘못된 접근으로 userInfoArr에 user 등록 취소');
            return;
        }
        console.log('userInfoArr: ');
        console.dir(userInfoArr);

        for (var i = 0; i < userInfoArr.length; i++) {
            if (userInfoArr[i].nickname == m_nickname) {
                socket.emit('redirect', '/wrong_access');
                console.log('이미 로그인 되어있음');
                return;
            }
        }
        userInfoArr.push({
            socketId: socket.id,
            id: m_id,
            nickname: m_nickname,
            room_num: 0
        });

        console.log('세션에 userInfoArr 등록');
        socket.handshake.session.user = userInfoArr;
        socket.handshake.session.save(function () {
            console.log('socket.io--client is ready에서 session 수정됨');
        });
        console.log('현재 세션 정보 : ');
        console.dir(socket.handshake.session.user);

        console.log('change nickname 전송 io.to(' + socket.id + ')');
        io.to(socket.id).emit('change nickname', socket.handshake.session, socket.id);


        chatManager.joinRoom_exp(0, socket, true); //대기실 입장
        socket.emit('complete join or leave room', 0, '대기실');
    });

    //~님의 접속을 환영합니다를 모두 마친 뒤에는 사용자 목록을 갱신하게 해줌.
    socket.on('finished change nickname', function () {
        //접속된 사용자 목록 갱신(브로드캐스트--모든 클라이언트의 사용자 목록 갱신)
        io.sockets.emit('update user list', socket.handshake.session);
        if (chatManager.getRoomList() != undefined) {
            io.sockets.emit('update room list', chatManager.getRoomList());
        }
    });
    //클라이언트가 서버에서 접속을 끊을 시 호출됨(비정상적으로 접속이 종료될 경우 바뀐 socketid를 세션에서 갱신함.)
    socket.on('disconnect', function () {
        console.log('user disconnected(socket) : ' + socket.id);
        shouldChangeIndex = -1;
        if (userInfoArr != undefined) {
            for (var i = 0; i < userInfoArr.length; i++) {
                if (userInfoArr[i].socketId == socket.id) {
                    shouldChangeIndex = i;
                }
            }
        }
    });
    //main.html의 $(document).ready가 수행될 시 client is ready 이벤트 보내짐
    //나가기 버튼을 누르지 않고 탭 닫기 버튼을 눌렀을 때 이 부분이 호출됨.
    socket.on('main.html is closed', function (exitNickname) {
        console.log('main.js--main.html is closed!');
        console.log('exitNickname : ');
        console.dir(exitNickname);
        if (socket.handshake.session.user) {
            console.log('로그아웃 합니다 2: ');
            Utils.logger.info('사용자 로그아웃 : ' + exitNickname);
            chatManager.leaveRoomByNickname(socket, exitNickname);
            //로그아웃 한 사용자를 세션에서 제거함.
            if (socket.handshake.session.user != undefined) {
                console.log('socket.handshake.session.user.length: ' + socket.handshake.session.user.length);
                for (var i = 0; i < socket.handshake.session.user.length; i++) {
                    if (socket.handshake.session.user[i].nickname == exitNickname) {
                        userInfoArr.splice(i, 1);
                        socket.handshake.session.user = userInfoArr;
                        //세션 수정 후 반드시 세이브해야함
                        socket.handshake.session.save();
                        console.log('socket.io -- main.html is closed에서 session 수정됨');
                        break;
                    }
                }
                console.log('현재 세션 정보 : ');
                console.dir(socket.handshake.session.user);

                //접속된 사용자 목록 갱신(브로드캐스트--모든 클라이언트의 사용자 목록 갱신)
                io.sockets.emit('update user list', socket.handshake.session);

            } else {
                console.log('아무도 로그인되어 있지 않습니다.');
            }
        }

        //이제 클라이언트가 소켓에서 접속을 끊어도 좋다는 뜻으로 main.html로 이벤트를 보냄.
        socket.emit('ok exit');
    });
}

//MySQL 서버가 연결되어있는지 확인하고 연결이 안되어있으면 연결함.
exports.checkDBServer = function () {

    console.log('db 서버가 연결되어있나요? : ' + dbExecute.chatDbServerConnected());
    if (!dbExecute.chatDbServerConnected()) //만약 db서버가 연결이 안되어있다면
    {
        dbExecute.connectToChatDB(); //db 서버에 연결
        dbExecute.createChatSchema(); //user schema 만들기
    }
}
//콘솔 함수 무효화
console.dir = function () {};
console.log = function () {};
