/*사용자가 회원가입시 정보가 저장되는 데이터베이스의 스키마입니다.*/
CREATE DATABASE IF NOT EXISTS chatDB DEFAULT CHARACTER SET utf8;

USE chatDB;

CREATE TABLE IF NOT EXISTS  user  
(
 userid VARCHAR(30) NOT NULL, /*사용자 아이디*/
 nickname VARCHAR(30) NOT NULL, /*사용자 닉네임*/
 password VARCHAR(30) NOT NULL, /*사용자 비밀번호*/
 PRIMARY KEY(userid)
);