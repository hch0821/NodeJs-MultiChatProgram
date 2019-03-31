/*채팅을 관리하는 모듈입니다*/

var roomList = []; //방 목록을 저장하는 배열
var room_num = 0; //방 번호
var io; //main.js의 socket.io 객체
var Utils = require('./Utils'); //서버로그, 타임스탬프를 관리하는 모듈
var codeParser = require('./codeParser'); //프로그램 코드를 정규 표현식을 이용해 색깔을 구분해주는 모듈

//main.js에 소켓 이벤트 핸들러 등록
exports.initChatSocket = function (socket, p_io) {
    io = p_io;
    
    //클라이언트에서 서버로 메시지가 왔을 경우
    socket.on('send message', function (user, message, toUser, isCode) {
        if(isCode) //만약 프로그램 코드가 왔을 경우
        {
            //코드를 색깔 구분하여 저장
            message = codeParser.parseCode(message);
        }
        
        //사용자가 욕설을 할경우 필터링을 하고 서버로그에 기록
        if(message.includes('심한욕')){
            var id = findIdByNickname(socket, user);
            Utils.logger.info('사용자 '+id+'가 욕설을 함');
            
            //욕설 필터 적용
            message = message.replace(/심한욕/gm, '****');
        }
        
        //귓속말 요청이 아닐 경우
        if (toUser == 'curRoom') {
            var room_message = user + ": " + message;
            var room_num = findRoomBySocketId(socket, socket.id);
            
            //해당 방에게 모두 메시지를 뿌림
            io.to(room_num).emit('receive message', Utils.timeStampFormat2() + room_message);
        } 
        //귓속말일 경우
        else {
            var user_socket_id = findUserByNickname(socket, user);
            var toUser_socket_id = findUserByNickname(socket, toUser);

            if (toUser_socket_id == undefined) {
                socket.emit('toUser is not connected', toUser);
                return;
            }

            var whisper_message1 = toUser + '님께 발신: ' + message;
            var whisper_message2 = user + '(귓속말): ' + message;
            
            //귓속말을 보낸 사용자와 귓속말을 받을 사용자에게만 메시지를 뿌림
            io.to(user_socket_id).emit('receive message', Utils.timeStampFormat2() + whisper_message1, 'whisper');
            io.to(toUser_socket_id).emit('receive message', Utils.timeStampFormat2() + whisper_message2, 'whisper');
        }
        
        
    });
    //방 만들기 요청시
    socket.on('create room', function (room_name) {
        createRoom(room_name, socket);
    });

    //방 입장 요청시
    socket.on('join room', function (room_num, room_name) {
        joinRoom(room_num, socket);
        socket.emit('complete join or leave room', room_num, room_name);
    });
    
    //방 나가기 요청시
    socket.on('exit room', function () {
        leaveRoom(socket);
        socket.emit('complete join or leave room', 0, '대기실');
    });
}

//방을 만드는 함수
function createRoom(room_name, socket) {
    if (room_name != undefined) {
        //방 목록을 저장하는 배열에 다음 정보 저장
        roomList.push({ 
            'room_num_user': 0, //방에 접속한 사용자 수
            'room_num': ++room_num, //방 번호
            'room_name': room_name //방 이름
        });
        console.log('방을 만들었습니다.\nroom list : ');
        console.dir(roomList);

        joinRoom(room_num, socket, false); //방을 만든 사람은 자동으로 그 방에 입장하도록 함
        socket.emit('complete join or leave room', room_num, room_name);

        //방 목록 갱신
        //브로드캐스트로 뿌림
        io.sockets.emit('update room list', roomList);

        //방 위치 갱신 목적
        //사용자 목록 갱신(브로드캐스트--모든 클라이언트의 사용자 목록 갱신)
        io.sockets.emit('update user list', socket.handshake.session);
        
        //서버로그에도 사용자가 방을 만들었다는 것을 기록
        var id = findIdByNickname(socket, findNicknameBySocketId(socket, socket.id));
        Utils.logger.info('사용자 ' + id + '가 ' + room_num + '번(' + room_name + ') 방을 만듬');
    }
}

//방에 입장하도록 하는 함수
function joinRoom(room_num, socket, leavePreviousRoom) {
    console.log('방에 입장합니다 : ' + room_num);

    if (!leavePreviousRoom) {
        var previousRoom = findRoomBySocketId(socket, socket.id);
        
        //방에 입장시 자동으로 전에 있던 방에서 나감
        socket.leave(previousRoom);
        for (var i = 0; i < roomList.length; i++) {
            if (roomList[i].room_num == previousRoom) {
                roomList[i].room_num_user--;   //방에 접속한 사용자수 1 감소
                console.log('방 사용자 감소 : ' + roomList[i].room_num_user);
                if (roomList[i].room_num_user == 0) { //방에 아무도 없을 시 방 제거
                    roomList.splice(i, 1);
                    console.log('방 제거 후: ');
                    console.dir(roomList);
                }
                break;
            }
        }
        if (previousRoom != 0) {
            io.to(previousRoom).emit('receive message', Utils.timeStampFormat2() + findNicknameBySocketId(socket, socket.id) + '님께서 '+previousRoom+'번 방에서 나가셨습니다.', 'notif');
        } 
    }
    socket.join(room_num); //방 입장
    //방에 접속한 사용자수 1 증가
    for (var i = 0; i < roomList.length; i++) {
        if (roomList[i].room_num == room_num) {
            roomList[i].room_num_user++;
            console.log('방 사용자 증가 : ' + roomList[i].room_num_user);
            break;
        }
    }

    console.log('roomList : ');
    console.dir(roomList);
    //방 목록 갱신
    //브로드캐스트
    io.sockets.emit('update room list', roomList);

    //사용자가 현재 어디 방에 있는지를 세션에 등록
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        if (socket.handshake.session.user[i].socketId == socket.id) {
            socket.handshake.session.user[i].room_num = room_num;
            break;
        }
    }
    //세션 저장
    socket.handshake.session.save(function () {
        console.log('socket.io--joinRoom()에서 session 수정됨');
    });
    console.log('현재 세션 정보 : ');
    console.dir(socket.handshake.session.user);
    
    //해당 방에 누가 입장했는지 알려줌
    var userNickname = findNicknameBySocketId(socket, socket.id);
    if (room_num != 0 && userNickname!=undefined) {
        io.to(room_num).emit('receive message', Utils.timeStampFormat2() + userNickname + '님께서 '+room_num+'번 방에 입장하셨습니다.', 'notif');
    } else {
        io.to(room_num).emit('receive message', Utils.timeStampFormat2() + userNickname + '님께서 대기실에 입장하셨습니다.', 'notif');
    }

    //방 위치 갱신 목적
    //사용자 목록 갱신(브로드캐스트--모든 클라이언트의 사용자 목록 갱신)
    io.sockets.emit('update user list', socket.handshake.session);
}

//대기실로 나감(방 0으로 감)
function leaveRoom(socket) {
    var room_num = findRoomBySocketId(socket, socket.id);
    socket.leave(room_num);

    //방에 접속한 사용자수 1 감소
    for (var i = 0; i < roomList.length; i++) {
        if (roomList[i].room_num == room_num) {

            roomList[i].room_num_user--;
            console.log('방 사용자 감소 : ' + roomList[i].room_num_user);
            if (roomList[i].room_num_user == 0) { //방에 있는 사용자의 수가 0명이면 방 제거
                roomList.splice(i, 1);
                console.log('방 제거 후: ');
                console.dir(roomList);
            }
            break;
        }
    }

    //세션에 저장되어있는 사용자의 방 위치 갱신
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        if (socket.handshake.session.user[i].room_num == socket.id) {
            socket.handshake.session.user[i].room_num = 0; //대기실
        }
    }
    //세션 저장
    socket.handshake.session.save(function () {
        console.log('socket.io--leaveRoom()에서 session 수정됨');
    });
    console.log('현재 세션 정보 : ');
    console.dir(socket.handshake.session.user);
    
    //해당 방에 누가 나갔는지 알려줌
    var userNickname = findNicknameBySocketId(socket, socket.id);
    if (room_num != 0 && userNickname!=undefined) {
        io.to(room_num).emit('receive message', Utils.timeStampFormat2() + userNickname + '님께서 '+room_num+'번 방에서 나가셨습니다.', 'notif');
    } else if(room_num == 0 && userNickname!=undefined){
        io.to(room_num).emit('receive message', Utils.timeStampFormat2() + userNickname + '님께서 대기실에서 나가셨습니다.', 'notif');
    }

    //방에서 나간후 대기실 입장
    joinRoom(0, socket, true);
    socket.emit('complete join or leave room', room_num, '대기실');

    //방 목록 갱신
    //브로드캐스트
    io.sockets.emit('update room list', roomList);

    //방 위치 갱신 목적
    //사용자 목록 갱신(브로드캐스트--모든 클라이언트의 사용자 목록 갱신)
    io.sockets.emit('update user list', socket.handshake.session);
}

//닉네임을 파라미터로 하여 방에서 나가게 할 수 있는 함수
exports.leaveRoomByNickname = function (socket, exitNickname) {
    var socketId = findUserByNickname(socket, exitNickname);
    var room_num = findRoomBySocketId(socket, socketId);

    //방에 접속한 사용자수 1 감소
    for (var i = 0; i < roomList.length; i++) {
        if (roomList[i].room_num == room_num) {

            roomList[i].room_num_user--;
            console.log('방 사용자 감소 : ' + roomList[i].room_num_user);
            if (roomList[i].room_num_user == 0) { //방에 있는 사용자의 수가 0명이면 방 제거
                roomList.splice(i, 1);
                console.log('방 제거 후: ');
                console.dir(roomList);
            }
            break;
        }
    }

    //세션 정보 중 방 번호 정보 갱신
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        if (socket.handshake.session.user[i].room_num == socket.id) {
            socket.handshake.session.user[i].room_num = 0; //대기실
        }
    }
    socket.handshake.session.save(function () {
        console.log('socket.io--leaveRoom()에서 session 수정됨');
    });
    console.log('현재 세션 정보 : ');
    console.dir(socket.handshake.session.user);
    var nickname = findNicknameBySocketId(socket, socket.id);
    if(nickname != undefined)
    {
        if (room_num != 0) {
            io.to(room_num).emit('receive message', Utils.timeStampFormat2() + nickname + '님께서 '+room_num+'번 방에서 나가셨습니다.', 'notif');
        } 
    }

    //방에서 나간후 대기실 입장
    joinRoom(0, socket, true);
    socket.emit('complete join or leave room', room_num, '대기실');

    //방 목록 갱신
    //브로드캐스트
    io.sockets.emit('update room list', roomList);

    //방 위치 갱신 목적
    //사용자 목록 갱신(브로드캐스트--모든 클라이언트의 사용자 목록 갱신)
    io.sockets.emit('update user list', socket.handshake.session);
}


//닉네임을 통해 소켓 아이디를 찾는 함수(세션 이용)
function findUserByNickname(socket, nickname) {
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        console.log('찾고자 하는 닉네임 : ' + nickname);
        console.dir(socket.handshake.session.user[i]);
        if (socket.handshake.session.user[i].nickname == nickname) {
            console.log('찾은 소켓 아이디 : ' + socket.handshake.session.user[i].socketId);
            return socket.handshake.session.user[i].socketId;
        }
    }
}

//소켓아이디를 통해 닉네임을 찾는 함수(세션 이용)
function findNicknameBySocketId(socket, socketId) {
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        //  console.log('찾고자 하는 닉네임 : '+ nickname);
        console.dir(socket.handshake.session.user[i]);
        if (socket.handshake.session.user[i].socketId == socketId) {
            // console.log('찾은 소켓 아이디 : '+ socket.handshake.session.user[i].socketId);
            return socket.handshake.session.user[i].nickname;
        }
    }

}

//소켓아이디를 통해 방번호를 찾는 함수(세션 이용)
function findRoomBySocketId(socket, socketId) {
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        console.dir(socket.handshake.session.user[i]);
        if (socket.handshake.session.user[i].socketId == socketId) {
            return socket.handshake.session.user[i].room_num;
        }
    }
}

//닉네임을 통해 사용자 아이디를 찾는 함수(세션 이용)
function findIdByNickname(socket, nickname) {
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        console.dir(socket.handshake.session.user[i]);
        if (socket.handshake.session.user[i].nickname == nickname) {
            return socket.handshake.session.user[i].id;
        }
    }
}

//방 목록을 저장하고 있는 배열을 반환
exports.getRoomList = function () {
    return roomList;
};

//위에 선언된 함수들을 다른 모듈에서도 쓸수 있게 export함
exports.joinRoom_exp = function (room_num, socket, leavePreviousRoom) {
    joinRoom(room_num, socket, leavePreviousRoom);
};
exports.findUserByNickname_exp = function (socket, nickname) {
    findUserByNickname(socket, nickname);
}
exports.findNicknameBySocketId_exp = function (socket, socketId) {
    findNicknameBySocketId(socket, socketId);
};
exports.findRoomBySocketId_exp = function (socket, socketId) {
    findRoomBySocketId(socket, socketId);
};
exports.findIdByNickname_exp = function (socket, nickname) {
    findIdByNickname(socket, nickname);
};

//콘솔 함수 무효화
console.dir = function () {};
console.log = function () {};
