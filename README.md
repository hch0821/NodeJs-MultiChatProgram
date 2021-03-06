# NodeJs-MultiChatProgram
## 프로젝트 
* 프로젝트 목적 : node.js를 이용한 멀티채팅 웹 프로그램
* 구현 기술 : html, Javascript, Node.js
* 구현 방법 : 서버와 클라이언트간의 소켓 통신
## Description

* 프로젝트 인원 : 1명
* 프로젝트 기간 : 2018. 05. 07 ~ 2018. 06.17

# Project Details

## 설계 프로젝트 개요

| 프로젝트 목적 | node.js를 이용한 채팅 웹 프로그램 |
| --- | --- |
| 구현 기술 | html, Javascript, Node.js |
| 구현 방법 | 서버와 클라이언트간의 소켓 통신 |


## 설계 프로젝트 개념적 설계

-  전체적인  디자인 의 워크플로

![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image75.png)

 ---------------------------------------
 
- 화면 디자인

로그인 화면(sign\_in.html)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image9.png)
 + 아이디와 비밀번호가 서버의 데이터베이스와 일치할 경우 로그인이 되며, 일치하지 않을 경우 로그인이 거절된다.로그인 버튼을 누를 시 바로 메인 화면으로 이동한다.
 + 회원가입 버튼을 누를 시 회원가입 화면으로 이동한다.

회원가입 화면(sign\_up.html)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image54.png)
 + 회원가입 화면에서는 사용자의 개인정보를 데이터베이스에 저장하도록 하는 동작을 한다.
 + 중복확인 버튼 클릭 시 데이터베이스에 동일 아이디나 닉네임이 있는지 확인한다.

- 메인 화면(main.js)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image78.png)
 + 접속한 자신의 닉네임을 상단에 보여준다.
 + 만들어진 방 목록을 보여준다.방 생성 버튼과 방 입장 버튼도 있다.
 + 현재 접속 중인 사용자들의 목록과 인원수를 보여주며 현재 사용자가 어느 방에 있는지도 보여준다.
 + 메시지를 전송할 때 전송 대상을 선택할 수 있어서 1:1 채팅 또는 현재 방에 있는 사람끼리 대화할 수 있다.
 + 전송 버튼을 누르면 메시지가 전송되며, 파일 전송버튼을 누르면 파일을 전송 할 수 있다.
코드 전송 버튼을 누르면 사용자가 색깔로 구별된 프로그램 코드를 전송할 수 있다. (snippet)
 + 탭 닫기 버튼을 누르면 로그아웃이 된다.

---------------------------------------

- 프로토콜  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image102.png)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image100.png)


---------------------------------------


- 서버 기능별  컴포넌트

| 기능 | 컴포넌트 |
| --- | --- |
| 로그인, 회원가입 | 데이터 베이스에 사용자 아이디, 닉네임, 비밀번호 저장데이터베이스에 접근하여 사용자 정보 조회 및 등록 |
| 채팅 | 방에서 대화, 귓속말로 대화, 욕설 필터, 파일 주고 받기 |
| 파일 | 파일 업로드, 파일 다운로드, 텍스트/이미지/오디오/비디오 파일을 읽어 들여 미리 보기 화면 생성. 동영상과 오디오 파일을 실시간으로 스트리밍 전송 |
| 코드 Snippet | Javascript 코드를 분석하여 html 태그를 이용해 색을 구분하여 전송 |
| 서버 로그 | 타임스탬프 기능을 활용하여 파일과 콘솔에 서버 기록을 남김 |

## 설계 프로젝트 코드레벨 설계

- 코드의 특징적 기술요소

1. 클라이언트와 서버의 통신:  socket.io, body-parser, router를 이용한다.

주로 클라이언트와 서버는 소켓 이벤트를 활용하여 대부분의 통신을 하게 된다.

body-parser와 router는 html파일에서 넘어온 정보를 분석 후 동작을 취하는데 사용한다.

1. 사용자 데이터베이스: MySQL 서버를 사용하며 쿼리를 통해 로그인, 회원가입을 수행한다. (sync-mysql 모듈 사용)
2. 채팅: 귓속말 기능, 방에서 대화 기능은 모두 socket .io 모듈을 사용한다.
3. 파일 업로드, 다운로드: formidable 모듈을 이용하여 파일을 업로드하며 다운로드는 router 이벤트 안에서 내장 함수를 이용하여 클라이언트에게 파일을 보낸다.
4. 파일 스트리밍: 기본적으로 fs 모듈의 스트림 함수를 이용하며, 파일을 스트림할 범위를 계산하여 전송 한다.
5. Snippet: 자바스크립트 코드를 정규 표현식(regular expression)을 이용해 분석한다.

명령어, 변수, 주석, 객체, 실수형 변수, 따옴표로 묶인 곳을 색으로 구분하여 코드를 다시 만들어낸다.

1. 서버로그: winston모듈과 moment 모듈을 이용하여 콘솔 창과 로그 파일에 서버의 기록(정보, 에러)을 남긴다.
2. 코드의 모듈화: 서버의 코드는 한 파일에 모두 들어가 있지 않고 기능별로 쪼개져 있다.


---------------------------------------


- 코드의 구성도, 코드 컴포넌트별 기능 정리

**클라이언트**      

| **파일** | **기능** |
| --- | --- |
| error.html | 404에러가 발생할 때 보여주는 화면이다. |
| main.html | 메인 채팅 클라이언트 파일이다. socket.io를 이용하여 서버에서 온 대부분의 메시지를 처리한다. |
| sign\_in.html | 로그인 화면이다. 서버와 socket.io를 이용하여 통신하며 사용자 데이터베이스에 로그인 하기 위해 접근한다. |
| sign\_in\_fail.html | 로그인을 실패했을 때 보여주는 화면이다. |
| sign\_up.html | 회원가입 화면이다. 서버와 socket.io를 이용하여 통신하며 사용자 데이터베이스에 아이디 중복확인, 닉네임 중복확인, 회원가입을 위해 접근한다. |
| wrong\_access.html | 로그인이 되지 않은 사용자가 채팅 서버에 접속했을 경우 보여주는 화면이다. |

**서버**      

| **파일** | **기능** |
| --- | --- |
| chatManager.js | 채팅을 관리하는 모듈이다.욕설 필터, 귓속말, 방에서 대화, 방 퇴장, 방 생성, 방 입장, 방 목록 관리, 사용자 정보가 등록된 세션 조회/삽입/수정 기능이 구현되어 있다. |
| codeParser.js | 자바스크립트 코드를 정규표현식을 이용해 코드의 색깔을 span 태그로 구분해주는 모듈이다.정규 표현식을 이용한 코드 분석, span 태그를 이용한 코드 색 입히기가 구현되어 있다. |
| dbExecute.js | MySQL 서버에 연결, 데이터 베이스 쿼리 수행을 하는 모듈이다. 쿼리 수행으로는 데이터베이스 생성, 사용자 정보 삽입, 아이디 조회, 닉네임 조회, 비밀번호 조회가 있다. |
| fileManager.js | 파일 업로드, 다운로드, 스트리밍을 관리하는 모듈이다.  업로드, 파일 다운로드 요청 시 파일 전송, 파일을 귓속말로 전송, 방으로 전송, 텍스트/이미지/오디오/비디오 파일 미리 보기, 오디오/비디오 파일을 스트리밍하는 기능이 구현되어 있다. |
| main.js | 모든 모듈들과 연결되어 있는 메인 서버 코드이다. 모든 모듈들이 main.js 에서 처리된다. |
| userManager.js | dbExecute.js의 메서드를 이용하는 모듈이다. 데이터베이스에 접근하여 사용자 로그인/회원가입을 수행하며, 사용자 정보를 세션에 등록할 수 있게 하는 모듈이다. |
| Utils.js | 서버로그를 관리하는 모듈이다. 콘솔 창과 로그파일에 서버 기록(정보, 에러)을 남긴다. |



---------------------------------------


- 코드 워크 플로
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image81.png)

## 설계 프로젝트 결과

- 프로젝트의 실행에 필요한 절차를 요약하고 각 스텝마다 사진 첨부

1. MySQL 비밀번호 설정  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image80.png)  
서버를 실행하기 전에 dbExcute.js 파일에서 MySQL서버의 비밀번호가 현재 비밀번호가 맞는지 확인한다.


2. 서버 실행    
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image84.png)  
main.js를 실행한다. main.js를 실행하면 MySQL 서버까지 자동으로 연결된다.


3. 회원가입 하기  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image54.png)  
로그인 화면에서 회원가입 버튼을 누른다.  
아이디, 닉네임 중복확인을 한 후 비밀번호를 입력하고 회원 가입 버튼을 누른다.


4. 로그인 후 채팅 페이지로 접속한 결과  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image85.png)  
 + 접속한 사용자의 닉네임이 보인다.  
 + 처음에 접속한 사용자는 대기실이라는 방에 입장한다.  
 + 누군가가 방에 들어오거나 나갈 경우 서버 메시지를 보여준다.  
 + 현재 사용자 목록이 보이며 사용자가 현재 어디 있는 지까지 볼 수 있다.  





5. 방 만들기  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image86.png)  
방 만들기 버튼을 누르면 방 이름을 입력 할 수 있고 확인 버튼을 누르면 방이 생성된다.  



6. 방 입장  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image88.png)  

 + 방을 만들면 방 목록이 갱신되며 방을 만든 사람은 자동으로 그 방으로 입장된다. 방 정보에는 방 번호, 방 이름, 방에 들어간 사람의 수가 보이게 된다.
 + 사용자가 방을 이동하면 사용자의 위치도 갱신된다.
 + 방에 입장하면 현재 방 번호와 방제목이 갱신된다.
 + 사용자가 방에 입장했다는 메시지가 뜬다.


7. 대기실과 각 방에서의 채팅

아래 사진을 보면,
대기실에서는 1번방에서 대화한 내용을 볼 수 없으며 1번방에서는 대기실에서 대화한 내용을 볼 수 없다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image89.png)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image90.png)  

8. 대기실에 있는 사용자와 방 1번 사용자간의 **귓속말**  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image96.png)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image92.png)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image94.png)  
한 명은 대기실에, 한 명은 1번방에 있지만 귓속말을 통하여 서로 대화할 수 있다.
사용자 목록에서 한 명을 선택한 뒤 **전송 대상 추가** 버튼을 클릭하면 위 그림에 보이는 전송 대상에 추가된다. 그 뒤에 그 전송 대상을 선택하면 그 사람에게 귓속말이 간다.


9. 방에 아무도 없으면 그 방은 자동으로 사라진다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image97.png)  


10. 파일 업로드
업로드를 시험할 파일 목록: 텍스트, 이미지, 오디오, 동영상 파일을 시험해보고자 한다.
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image99.png)  
 + 파일 업로드 시 업로드 진행 상황을 막대 게이지로 표시한다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image103.png)  

 + 텍스트 파일 업로드 시

채팅 창에 다운로드 버튼이 생성되며 텍스트 파일을 미리 볼 수 있는 화면이 생긴다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image60.png)  

 + 이미지 파일 업로드 시

채팅 창에 사진 다운로드 버튼과 미리 보기 화면이 생긴다.  

이미지를 새 탭에서 크게 볼 수도 있다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image61.png)  
  
 + 오디오 파일 업로드 시

채팅 창에 다운로드 버튼이 생기며, 바로 재생 할 수 있도록 컨트롤이 생긴다.  
이 때 재생 버튼을 누르면 서버에서 오디오 파일을 실시간으로 스트리밍한다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image62.png)  

 + 동영상 파일 업로드 시  

채팅 창에 다운로드 버튼이 생기며 실시간으로 재생할 수 있도록 컨트롤이 생긴다.  

재생 버튼을 누르면 오디오 파일과 마찬가지로 파일을 실시간으로 스트리밍한다.  

동영상을 새 탭이나 전체화면으로 볼 수도 있다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image64.png)  

 + 파일을 받은 사용자가 다운로드 버튼을 누를 시  

사진에서 보듯이,  다운로드 버튼을 누르게 되면 크롬 브라우저에서 일반 파일을 다운받는 것처럼 창 하단에 다운로드가 된다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image65.png)  
 + 파일을 귓속말로 주고 받기  

서로 다른 방에 있는 사용자끼리 귓속말로 파일을 전송 할 수도 있다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image67.png)  



11. 서버 로그


 + 사용자가 로그인하거나, 로그아웃 하거나, 방을 만들거나, 에러가 날 경우 콘솔 창과 파일에 기록을 한다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image69.png)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image68.png)  
 + 사용자가 욕설을 했을 때 (현재 욕설 단어는 &#39;심한욕&#39; 만 등록되어있음)  

사진처럼 사용자가 욕설을 하면 채팅 창에는 \*로 필터링 처리되며, 서버 로그에도 기록을 한다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image104.png)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image70.png)  

12. **추가 기능** - 자바스크립트 코드 전송하기(Snippet 기능)
아래 사진과 같이 **프로그램 코드** 를 채팅 창에 그냥 보내버리면 글자도 정렬이 되지 않고, 색깔로 구분 되어 있지 않아서 읽기가 힘들다. 이를 위해 이 기능을 구현해보았다.


 + 코드를 그냥 보냈을 때: 코드가 정리되어 있지 않고 보기 힘들다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image19.png)  

 + 코드를 코드 전송 기능을 이용해서 보냈을 때:  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image20.png)  
  
코드를 볼 수 있는 창이 하나 생성 되었고 tab과 공백, 색, 글꼴이 구분되어 있어서 코드를 보기 편하다.  


13. 예외 처리

 + 사용자가 엉뚱한 페이지를 입력했을 경우  
404에러를 보내며 요청한 페이지가 없다는 메시지를 남긴다.  

![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image21.png)  

 + 이미 해당 사용자가 로그인 되어있거나 로그인도 하지 않고 채팅 서버에 접속을 시도하는 경우 아래와 같은 메시지를 띄운다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image22.png)  


 + 자기 자신을 전송 대상(귓속말 대상)에 추가하려는 경우

자기 자신에게는 메시지를 보낼 수 없다는 메시지를 띄운다.  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image23.png)  
  
 + 현재 있는 방과 같은 방으로 이동하려고 시도할 경우 

또다시 들어가지 못하게 막는다. (오류 방지)  
![](https://github.com/hch0821/NodeJs-MultiChatProgram/blob/master/images/image25.png)  

-이상입니다-  
