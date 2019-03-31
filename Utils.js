/*서버로그, 타임스탬프를 관리하는 모듈입니다.*/
var winston = require('winston'); //서버 로깅을 해주는 모듈
var fs = require('fs'); //파일 시스템 모듈
var path = require('path'); //파일 경로 관련 모듈
var winstonDaily = require('winston-daily-rotate-file'); //날마다 다른 로그 파일 생성해줌
var moment = require('moment'); //현 날짜를 알려주는 모듈

exports.timeStampFormat = function() { //현재 날짜 반환하는 함수1
    return moment().format('YYYYMMDDHHmmss');
}
exports.timeStampFormat2 = function() { //현재 날짜 반환하는 함수2
    return '['+moment().format('YY/MM/DD HH:mm:ss')+'] ';
}

function timeStampFormat3(){ //현재 날짜 반환하는 함수3
    return moment().format('YYYY-MM-DD HH:mm:ss.SS');
}

//콘솔창과 로그 파일에 서버 기록을 남겨주는 객체
var logger = new (winston.Logger)({
    transports: [
        
        //파일에 뿌리기
        new (winstonDaily)({
            filename: __dirname+'/log/server-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),
        
        //콘솔창에 뿌리기
        new (winston.transports.Console)({
            name:'debug-console',
            colorize:true,
            level:'debug',
            showLevel:true,
            json:false,
            timestamp:timeStampFormat3
        })
    ]
});

exports.logger = logger;

//logger.info('info message');
//logger.verbose('verbose message');
//logger.debug('debug message');
//logger.error('error message');
