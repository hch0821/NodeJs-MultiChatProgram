/*파일 업로드, 다운로드, 스트리밍을 관리하는 모듈입니다*/

var path = require('path'); //파일 경로 설정을 위한 모듈
var fs = require('fs'); //파일 시스템 모듈
var formidable = require('formidable'); //파일 업로드를 위한 모듈
var readline = require('readline'); //텍스트 파일을 한 줄씩 읽기 위한 모듈
var mime = require('mime-types'); //파일의 mimeType을 알기 위한 모듈
var Utils = require('./Utils.js'); //서버로그, 타임스탬프를 관리하는 모듈
var router; //main.js의 router 객체
var io; //main.js의 socket.io 객체
var app; //main.js의 express 객체
var m_socket; //소켓 객체
var socketId; //보낼 클라이언트의 소켓 아이디
var toUser; //귓속말 상대

//모듈 초기화
exports.init = function (p_app, p_io, p_router) {
    app = p_app;
    io = p_io;
    router = p_router;
    if (!fs.existsSync(__dirname + '/temp')) {
        fs.mkdir(__dirname + '/temp', function(err){
            console.log(err)
        });
    }
}

//main.js에 router 이벤트 핸들러 등록
exports.initFileRouter = function () {
    //클라이언트가 파일 업로드를 요청할경우
    router.route('/upload').post(function (req, res) {
        console.log('/upload 라우팅 함수 호출됨.');
        var form = new formidable.IncomingForm();
        
        //업로드할수있는 최대파일 크기 : 10GB
        form.maxFileSize = 1024 * 1024 * 1024 * 1024 * 10; 
        form.encoding = 'utf-8'; //인코딩 : utf-8
        form.uploadDir = __dirname + '/temp'; //업로드 파일 임시 저장 폴더
        form.multiples = false; //파일을 여러개 업로드 할 수 없게 함
        var uploadedFile;
        var userNickname;
        
        //업로드를 요청하는게 누군지 파악
        form.on('field', function (name, value) {
            if (name == 'curNickname') {
                userNickname = value; //닉네임
                socketId = findUserByNickname(m_socket, value);//소켓아이디
                console.log('socketId : ' + socketId);
            } else if (name == 'curToUser') {
                toUser = value;
            }
        });
        form.parse(req, function (err, fields, files) {
            console.log('fields : ');
        });
        //업로드 시작시 업로드 될 파일의 정보 저장
        form.on('fileBegin', function (name, file) {
            console.log('업로드 시작.. file : ');
            console.dir(file);
            uploadedFile = file;
        });
        
        //업로드가 진행중일 때 클라이언트에 진행 게이지를 보여줌
        form.on('progress', function (bytesReceived, bytesExpected) {
            if (socketId != undefined) {
                io.to(socketId).emit('upload progress', bytesReceived / bytesExpected * 100);
            }
        });
        
        //업로드 실패
        form.on('error', function (err) {
            console.log('업로드 실패 : ' + err);
            io.to(socketId).emit('upload aborted');
            socketId = undefined;
            Utils.logger.error('업로드 실패 : 사용자에 의해 업로드가 취소됨');
        });
        
        //업로드 취소
        form.on('aborted', function () {
            console.log('업로드 취소됨.');
            io.to(socketId).emit('upload aborted');
            socketId = undefined;
            Utils.logger.error('업로드 실패 : 사용자에 의해 업로드가 취소됨');
        });
        
        //업로드 완료시 임시 폴더에 있는 파일을 다른 위치로 옮기고 클라이언트로 파일을 받을 수 있게 
        //메시지를 보낸다.
        form.on('end', function () {
            console.log('upload end');
            var sendFileInfo = {}; //클라이언트로 보낼 업로드된 파일의 정보
            if (!fs.existsSync(__dirname + '/public/uploads')) {
                fs.mkdir(__dirname + '/public/uploads', function(error){
                    Utils.logger.error('폴더 만들기 실패 :', error);
                });
            }

            var oldpath; //업로드된 파일의 임시 위치
            var newpath; //업로드된 파일을 옮길 위치
            var filename; //업로드된 파일의 이름

            console.log('uploadedFile.name : ' + uploadedFile.name);
            var extension = path.extname(uploadedFile.name); //파일 확장자
            var basename = path.basename(uploadedFile.name, extension); //확장자를 제외한 이름
            filename = basename + Utils.timeStampFormat() + extension;
            oldpath = uploadedFile.path;
            newpath = __dirname + '/public/uploads/' + filename;

            fs.renameSync(oldpath, newpath); //업로드된 파일을 temp에서 upload 폴더로 옮김
            console.log('생성된 파일 : ' + newpath);
            var mimeType = mime.lookup(filename); //파일의 mime type 가져오기
            sendFileInfo.mimeType = mimeType; 
            sendFileInfo.fileName = filename;
            var room = findRoomBySocketId(m_socket, socketId);

            //귓속말로 파일 보내기
            if (toUser != undefined) {
                if (toUser != 'curRoom') { //귓속말 상대가 지정되어있다면
                    var toUser_socket_id = findUserByNickname(m_socket, toUser);
                    if (toUser_socket_id == undefined) {
                        io.to(socketId).emit('toUser is not connected', toUser);
                        return;
                    }
                    io.to(socketId).emit('receive file', Utils.timeStampFormat2() + toUser + "님께 발신: ", sendFileInfo, 'whisper');
                    io.to(toUser_socket_id).emit('receive file', Utils.timeStampFormat2() + userNickname + "(귓속말): ", sendFileInfo, 'whisper');
                }
                //귓속말 상대가 지정되어있지 않다면 방이나 대기실로 보내기
                else {
                    io.to(room).emit('receive file', Utils.timeStampFormat2() + userNickname + ": ", sendFileInfo, 'toRoom');
                }
            }
            socketId = undefined;
            toUser = undefined;
        });
        res.send('<script>window.close();</script>')
    });


    //파일 다운로드 요청을 받을 경우
    router.route('/down/:filename').get(function (req, res) {
        console.log('/down:filename 라우팅 함수 호출됨.');
        var paramFileName = req.params.filename;
        console.log(paramFileName);
        var path = __dirname + '/public/uploads/' + paramFileName;
        console.log(path);
        res.download(path); //파일을 클라이언트에게 주기
    });
    
    //텍스트(.txt) 파일 미리보기 요청을 받을 경우  
    app.get('/readText/:fileName', function (req, res) {
        var resultStr = "";
        var fileName = req.params.fileName;
        var path = __dirname + '/public/uploads/' + fileName;
        
        //텍스트 파일을 한 줄씩 읽어들이는 모듈 사용
        var lineReader = readline.createInterface({
            input: fs.createReadStream(path)
        });
        
        //한 줄을 읽을 때마다 
        lineReader.on('line', function (line) {
            //개행 태그를 넣어줌
            resultStr = resultStr.concat(line + '<br>');
        });
        //텍스트 파일을 모두 읽으면
        lineReader.on('close', function () {
            if (resultStr == "") {
                res.send('텍스트 파일 읽기 실패!')
            } else {
                res.send(resultStr); //결과를 보내줌
            }
        });
    });
    //동영상 또는 오디오 파일을 스트림 요청할 경우
    app.get('/stream/:fileInfo', function (req, res) {
        console.log('/stream 라우팅 함수 호출됨.');

        var fileInfo = req.params.fileInfo; //클라이언트에서온 파일 정보를 받음
        console.log('fileInfo : ' + fileInfo);

        var fileInfoParts = fileInfo.split('::');

        var fileName = fileInfoParts[0]; //파일 이름
        var mimeType = fileInfoParts[1] + '/' + fileInfoParts[2]; //파일 mime type
        var path = __dirname + '/public/uploads/' + fileName; //파일이 저장된 위치

        var stat = fs.statSync(path); //파일 정보
        var fileSize = stat.size; //파일 크기

        //사용자가 비디오 또는 오디오 컨트롤의 track ball을 건드렸을 때 스트림을 하기 위해 파일을 쪼갤 범위를 설정한다.
        //쪼갤 범위의 시작이 start, 끝이 end이다.
        //파일을 쪼갠후 client로 stream으로 전송하게된다.
        //(0)<---------------전체 파일 ---------------------->(파일 크기)
        //        (start)<-쪼갤범위(range)->(end)
        var range = req.headers.range;
        console.log('range : ');
        console.dir(range);
        if (range != undefined) //range가 req를 통해 넘어왔다면
        {
            //range의 형식은 bytes=(쪼갤 범위의 시작)-(쪼갤 범위의 끝)
            //보통 쪼갤 범위의 시작은 넘어오지만 쪼갤 범위의 끝은 넘어오지 않는다.
            //bytes=start-end를 배열 [start, end]로 변경
            var parts = range.replace(/bytes=/, "").split("-");
            var start = parseInt(parts[0], 10); //변경한 배열의 첫 번째값이 start

            var end;
            if (parts[1] != "") //end가 req를 통해 넘어왔다면
            {
                end = parseInt(parts[1], 10) //end를 그대로 가져옴
            } else //end가 넘어오지 않았다면
            {
                end = fileSize - 1; //end를 파일의 끝으로 지정
            }

            //쪼갤 chunk
            //크기 == 범위의 끝 - 시작 +1
            var chunksize = (end - start) + 1;

            //스트림 객체 생성
            var readStream = fs.createReadStream(path, {
                start,
                /*chunk의 시작*/
                end /*chunk의 끝*/
            });

            //스트림 할 때 필요로 하는 헤더 정보 입력
            var head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`, //쪼갤 범위 : chunk의 시작 - chunk의 끝 / 파일 전체 크기
                'Accept-Ranges': 'bytes', //range 단위 : 바이트
                'Content-Length': chunksize, //stream할 범위 : 쪼갤 범위의 크기
                'Content-Type': mimeType, //mimType 넣기
            };
            console.dir(head);
            res.writeHead(206, head); //헤드 정보 전송
            readStream.pipe(res); //pipe를 통해 클라이언트로 전송
        } else //range가 req를 통해 넘어오지 않았다면
        {
            //파일 전체 범위를 쪼개어서 보냄 

            //스트림 할 때 필요로 하는 헤더 정보
            var head = {
                'Content-Length': fileSize, //파일 전체를 바로 쪼개서 보냄
                'Content-Type': mimeType, //mimType 넣기
            };
            console.dir(head);
            res.writeHead(200, head); //헤드 정보 전송
            fs.createReadStream(path).pipe(res); //파이프로 비디오를 스트림하여 전송
        }
    });
    
}
//main.js의 socket 변수와 이 모듈의 소켓 변수 연결
exports.initFileSocket = function (socket) {
    m_socket = socket;
}

//닉네임으로 소켓 아이디 찾기(세션 이용)
function findUserByNickname(socket, nickname) {
    if (socket == undefined) {
        socket.emit('wrong access');
        return;
    }
    if (socket.handshake.session == undefined) {
        socket.emit('wrong access');
        return;
    }
    if (socket.handshake.session.user == undefined) {
        socket.emit('wrong access');
        return;
    }
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        if (socket.handshake.session.user[i].nickname == nickname) {
            return socket.handshake.session.user[i].socketId;
        }
    }
}

//소켓 아이디로 닉네임 찾기(세션 이용)
function findNicknameBySocketId(socket, socketId) {
    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        if (socket.handshake.session.user[i].socketId == socketId) {
            return socket.handshake.session.user[i].nickname;
        }
    }
}

//소켓 아이디로 방 번호 찾기(세션 이용)
function findRoomBySocketId(socket, socketId) {

    for (var i = 0; i < socket.handshake.session.user.length; i++) {
        if (socket.handshake.session.user[i].socketId == socketId) {
            return socket.handshake.session.user[i].room_num;
        }
    }
}
//콘솔 함수 무효화
//console.dir = function () {};
//console.log = function () {};
