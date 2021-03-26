var localstorage = window.localStorage //使用localstorage存储用户信息
var sessionstorage = window.sessionStorage //使用sessionStorage短暂存储用户信息

var classlist //班级列表，班级id等
var stdentList //当前班级学生列表
var extraCourse //当前班级额外课程
var token //记录账号登陆信息
var currentClass; //当前班级id
var currentClassName; //当前班级名
var currentCourse = '高等数学'; //当前课程名，默认高数

// 课程名与英文名映射字典
var courseReflect = {
    '高等数学':'math',
    '大学英语':'english',
    'Java程序设计': 'java',
    '操作系统': 'os',
    '体育': 'sports'
}

$(function () {
    //初始化页面
    isLogined();

    //设置按钮点击事件:切换班级
    $('body').on('click','.switch-class', function () {
        var classname = $(this).html();
        currentClassName = classname;
        currentClass = getClassID(classname);
        updateList(currentClass, currentCourse);
        $('.sub-header')[0].childNodes[0].nodeValue=classname;
    });

    //设置按钮点击事件:切换课程
    $('body').on('click', '.course', function () {
        currentCourse =  $(this).html();
        $('.page-header').text(currentCourse);
        updateList(currentClass, currentCourse)
    });

    //设置按钮点击事件:切换平均成绩
    $('body').on('click', '#avg-grade', function () {
        $('.page-header').text($(this).html());
        $('tbody').empty();
        //向服务器发送请求
        $.ajax(
            {
                url:'http://49.234.82.226:8080/student/average/' + currentClass,
                type:'get',
                dateType:'json',
                async: false,
                headers: {
                    'Authorization': token,
                    'Content-Type':'application/json;charset=utf-8'
                },
                success:function(response){
                    var i=1;
                    $.each(response, function (index, value) {
                        content = "<tr><td>"+ i +"</td><td>"+ value.name+"</td><td>"+value.number+"</td><td>"+value.math+"</td></tr>"
                        i = i+1;
                        $('tbody').append(content);
                    });
                },
                error:function(e){
                    console.log("error");
                    console.log(e);
                }
            }
        );
    });

    //设置按钮点击事件:切换额外课程
    $('body').on('click', '.extra', function () {
        currentCourse =  $(this).html();
        $('.page-header').text(currentCourse);
        updateExtra(currentClassName, currentCourse);
    });

    // 设置按钮点击事件:登录页面
    $('#login-show').click(function (e) {
        $('.wrapper').hide();
        $('#login-window').show(); 
        $(document).one("click", function(){
            $("#login-window").hide();
            e.stopPropagation();
        });
        $("#login-window").on("click", function(e){
            e.stopPropagation();
        });
        return false;
    });
    

    //记住我
    if (localstorage.getItem('username') != null) {
        $("input[name='username']").val(localstorage.getItem('username'));
        $('input[name="password"]').val(localstorage.getItem('password'));
        $('input[name="rememberMe"]').attr("checked", true);
    }


    //设置按钮点击事件:点击登录
    $('#login').click(function (e) {
        var user = $('input[name="username"]').val();
        var pwd = $('input[name="password"]').val();
        if(!user){
            alert('请输入账户');
        }else{
            if(!pwd){
                alert('请输入密码');
            }else{
                data = {
                    'username': user,
                    'password': pwd,
                }
                //向服务器发送请求
                $.ajax(
                    {
                        url:'http://49.234.82.226:8080/user/login',
                        type:'post',
                        dateType:'json',
                        async: false,
                        data: JSON.stringify(data),
                        headers: {
                            'Content-Type':'application/json;charset=utf-8'
                        },
                        success:function(response){
                            if(response.code==400){
                                alert('密码错误');
                            }else{
                                exitLogin();
                                remember = $('input[name="rememberMe"]').is(':checked') ? 1 : 0;
                                if(response.role == 1){
                                    $('#operation').show();
                                    $('#add-class').show();
                                }
                                localstorage.setItem('role',response.role);
                                //如果“记住我是被选中的，则保存姓名和密码信息”
                                if (remember == 1) {
                                    localStorage.setItem('user_token', response.token)
                                    localstorage.setItem('username',user);
                                    localstorage.setItem('password',pwd);
                                    console.log(localstorage.getItem('username'));
                                //如果“记住我是没被选中的，则移除之前已经保存过的信息。”
                                } else {
                                    sessionstorage.setItem('user_token', response.token)
                                    sessionstorage.setItem('username',user);
                                    sessionstorage.setItem('password',pwd);
                                    localStorage.removeItem('user_token')
                                    localstorage.removeItem('username');
                                    localstorage.removeItem('password');
                                }
                                $('#login-window').hide();
                                $('#login-show').text(user);
                                token = response.token;
                                initpage();
                                console.log(response);
                            }
                        },
                        error:function(e){alert('登录失败')}
                    }
                );
            }
        }
        e.preventDefault();
    });

    //设置按钮点击事件:退出登录
    $('#exit-login').click(function (e) {
        exitLogin();
        
        e.preventDefault();
    });

    //设置按钮点击事件:注册页面
    $('#register-show').click(function (e) {
        $('.wrapper').hide();
        $('#register-window').show();
        $(document).one("click", function(){
            $("#register-window").hide();
            e.stopPropagation();
        });
        $("#register-window").on("click", function(e){
            e.stopPropagation();
        });
        return false;
    });

    
    //设置按钮点击事件: 验证email
    $('#ver-email').click(function (e) {
        var email =$('input[name="email"]').val();
        if(!email){
            alert('请输入邮箱');
        }else{
            //向服务器发送请求
            $.ajax(
                {
                    url:'http://49.234.82.226:8080/user/email?email='+email,
                    type:'post',
                    dateType:'json',
                    headers: {
                        'Content-Type':'application/json;charset=utf-8'
                    },
                    success:function(response){
                        alert(response.msg);
                    },
                    error:function(e){
                        alert('出错了')
                        console.log(e);
                    }
                }
            );
        }
        
        e.preventDefault();
    });


    //设置按钮点击事件: 点击注册
    $('#register').click(function (e) {
        var reuser = $('input[name="reusername"]').val();
        var repwd = $('input[name="repassword"]').val();
        var role = $('input[name="authority"]:checked').val();
        var ver = $('input[name="vercode"]').val();
        var email =$('input[name="email"]').val();
        if(!(reuser&&repwd&&ver)){
            alert('输入不能为空');
        }else{
            data = {
                'username': reuser,
                'password': repwd,
                'email': email,
                'role': role,
                'vercode':ver
            }
            //向服务器发送请求
            $.ajax(
                {
                    url:'http://49.234.82.226:8080/user/ver_register',
                    type:'post',
                    dateType:'json',
                    headers: {
                        'Content-Type':'application/json;charset=utf-8'
                    },
                    data:JSON.stringify(data),
                    success:function(response){
                        alert(response.msg);
                        $('#register-window').hide();
                    },
                    error:function(e){alert(e);}
                }
            );
        }        
        e.preventDefault();
    });


    //设置按钮点击事件: 搜索修改弹框
    $('#search-mod').click(function (e) {
        $('.wrapper').hide();
        $('#search-mod-page').fadeIn(500);
        e.preventDefault();
    });

    //设置按钮点击事件: 关闭修改弹框
    $('.close-button-sm').click(function (e) {
        $('#search-mod-page').fadeOut(500); 
        e.preventDefault();
    });

    //设置按钮点击事件:搜索
    $('#search-btn').click(function (e) {
        var stuid = $('#search-input').val();
        if(!stuid){
            alert('请输入学号');
        }else{
            //向服务器发送请求
            $.ajax(
                {
                    url:'http://49.234.82.226:8080/student/search/'+ currentClass +'?key_word=' + stuid,
                    type:'get',
                    dateType:'json',
                    headers: {
                        'Authorization': token,
                        'Content-Type':'application/json;charset=utf-8'
                    },
                    success:function(response){
                        value = response[0];
                        if(value){
                            $('input[name="mod-stu-name"]').val(value.name);
                            $("#mod-cho-class").attr("placeholder", getClassName(value.class_id));
                            $('input[name="mod-math"]').val(value.math);
                            $('input[name="mod-english"]').val(value.english);
                            $('input[name="mod-Java"]').val(value.java);
                            $('input[name="mod-os"]').val(value.os);
                            $('input[name="mod-pe"]').val(value.sports);
                        }else{
                            alert('当前班级没有此学生');
                        }
                    },
                    error:function(e){
                        console.log("error");
                        console.log(e);
                    }
                }
            );
        }
        e.preventDefault();
    });



    //设置按钮点击事件: 修改学生信息
    $('#btn-mod').click(function (e) {
        var name = $('input[name="mod-stu-name"]').val();
        var stuid = $('#search-input').val();
        var dbID = getDBStuID(stuid);
        var classname = $("#mod-cho-class").attr("placeholder");
        var classid = getClassID(classname);
        var math = $('input[name="mod-math"]').val();
        var english = $('input[name="mod-english"]').val();
        var java =$('input[name="mod-Java"]').val();
        var os = $('input[name="mod-os"]').val();
        var pe =$('input[name="mod-pe"]').val();

        mydata = {
            'student_id':dbID,
            'name': name,
            'number': stuid,
            'class_id': classid,
            'math': parseInt(math),
            'english':parseInt(english),
            'java': parseInt(java),
            'os': parseInt(os),
            'sports':parseInt(pe)
        }
        //向服务器发送请求
        $.ajax(
            {
                url:'http://49.234.82.226:8080/student/one',
                type:'put',
                dateType:'json',
                headers: {
                    'Authorization': token,
                    'Content-Type':'application/json;charset=utf-8'
                },
                data:JSON.stringify(mydata),
                success:function(response){
                    alert(response.msg);
                    updateList(currentClass, currentCourse);
                },
                error:function(e){
                    alert("error");
                    console.log(e);
                }
            }
        );
        e.preventDefault();
    });



    //设置按钮点击事件: 班级输入弹框
    $('#add-class').click(function (e) {
        $('.wrapper').hide();
        $('#class-input').slideDown(500); 
        return false;
    });

    //设置按钮点击事件: 添加班级
    $('#new-class').click(function (e) {
        var newClass = $("input[name='new-class-name']").val();
        if(!newClass){
            alert('请输入班级');
        }else{
            //向服务器发送请求
            $.ajax(
                {
                    url:'http://49.234.82.226:8080/class/new?class_name='+newClass,
                    type:'post',
                    dateType:'json',
                    headers: {
                        'Authorization': token,
                        'Content-Type':'application/json;charset=utf-8'
                    },
                    success:function(response){
                        var content1 = '<li><a href="#" class="switch-class">' +  newClass + '</a></li>'
                        var content2 = '<li><a href="#" class="cho-class">' +  newClass + '</a></li>'
                        $('.divider').before(content1);
                        $('.classList').append(content2);
                        alert(response.msg);
                    },
                    error:function(e){
                        alert("error");
                        console.log(e);
                    }
                }
            );

        }
        e.preventDefault();
    });

    //设置按钮点击事件: 关闭班级弹框
    $('.close-button-class').click(function (e) {
        $('#class-input').slideUp(500); 
        e.preventDefault();
    });



    //设置按钮点击事件: 课程输入弹框
    $('#add-course').click(function (e) {
        $('.wrapper').hide();
        $('#course-input').slideDown(500); 
        return false;
    });


    //设置按钮点击事件: 添加课程
    $('#new-course').click(function (e) {
        var newCourse = $("input[name='new-course-name']").val();
        var classname = $("#course-cho-class").attr("placeholder");
        if(!newCourse){
            alert('请输入课程');
        }else{
            if(classname=='班级'){
                alert('请选择班级');
            }else{
                mydata = {
                    "class_name": classname,
                    "course_extra": newCourse
                }
                //向服务器发送请求
                $.ajax(
                    {
                        url:'http://49.234.82.226:8080/class/course',
                        type:'post',
                        dateType:'json',
                        headers: {
                            'Authorization': token,
                            'Content-Type':'application/json;charset=utf-8'
                        },
                        data:JSON.stringify(mydata),
                        success:function(response){
                            addCourse(newCourse);
                            $('#course-input').hide();
                            alert(response.msg);
                        },
                        error:function(e){
                            alert("error");
                            console.log(e);
                        }
                    }
                );

            }
        }
        e.preventDefault();
    });

    //设置按钮点击事件: 关闭课程
    $('.close-button-course').click(function (e) {
        $('#course-input').slideUp(500); 
        e.preventDefault();
    });


  
    //设置按钮点击事件: 删除学生页面
    $('#del-stu').click(function (e) {
        $('.wrapper').hide();
        $('#stu-del').slideDown(500); 
        return false;
    });


    //设置按钮点击事件: 删除
    $('#delete').click(function (e) {
        var stuID = $("input[name='sru-del-id']").val();
        if(!stuID){
            alert('请输入学号');
        }else{
            //向服务器发送请求
            $.ajax(
                {
                    url:'http://49.234.82.226:8080/student/one?number='+stuID,
                    type:'delete',
                    dateType:'json',
                    headers: {
                        'Authorization': token,
                        'Content-Type':'application/json;charset=utf-8'
                    },
                    success:function(response){
                        alert(response.msg);
                    },
                    error:function(e){
                        alert("error");
                        console.log(e);
                    }
                }
            );
        }
        e.preventDefault();
    });

    //设置按钮点击事件: 关闭删除页面
    $('.close-button-del').click(function (e) {
        $('#stu-del').slideUp(500); 
        e.preventDefault();
        
    });

    //-----------------------------------------------------------//


    //设置按钮点击事件: 添加学生页面
    $('#add-stu').click(function (e) {
        $('.wrapper').hide();
        $('#add-stu-input').fadeIn(500); 
        return false;
    });

    //设置按钮点击事件: 选择班级
    $('body').on('click','.cho-class', function () {
        $('input[name="class-id"]').attr("placeholder",$(this).html());
        $('#stu-cho-class').attr("placeholder",$(this).html());
    });

    //设置按钮点击事件: 添加学生记录
    $('#add-stu-grade').click(function (e) {
        var name = $('input[name="stu-name"]').val();
        var stuid = $('input[name="stu-id"]').val();
        var classname = $("#stu-cho-class").attr("placeholder");
        var classid = getClassID(classname);
        var math = $('input[name="math"]').val();
        var english = $('input[name="english"]').val();
        var java =$('input[name="Java"]').val();
        var os = $('input[name="os"]').val();
        var pe =$('input[name="pe"]').val();

        if(!(name&&stuid&&classid&&math&&english&&java&&os&&os&&pe)){
            alert('输入不能为空');
        }else{
            mydata = {
                'name': name,
                'number': stuid,
                'class_id': classid,
                'math': parseInt(math),
                'english':parseInt(english),
                'java': parseInt(java),
                'os': parseInt(os),
                'sports':parseInt(pe)
            }
            // 向服务器发送请求
            $.ajax(
                {
                    url:'http://49.234.82.226:8080/student/new',
                    type:'post',
                    dateType:'json',
                    headers: {
                        'Authorization': token,
                        'Content-Type':'application/json;charset=utf-8'
                    },
                    data:JSON.stringify(mydata),
                    
                    success:function(response){
                        alert(response.msg);
                    },
                    error:function(e){
                        alert("error");
                        console.log(e);
                    }
                }
            );
        }
        e.preventDefault();
    });
    
    //设置按钮点击事件: 关闭添加学生页面
    $('.close-button-stud').click(function (e) {
        $('#add-stu-input').fadeOut(500); 
        e.preventDefault();
        
    });

    //设置按钮点击事件: 导入excel
    $('#import').click(function (e) {
        $('.wrapper').hide();
        $('#import-page').fadeIn(500); 
        e.preventDefault();
    });

    //设置按钮点击事件: 导入按钮
    $('#import-btn').click(function (e) {
        var formdata = new FormData();
        var file = $('#import-file-input')[0].files[0];
        if(!file){
            alert('请选择文件');
        }else{
            formdata.append('file', $('#import-file-input')[0].files[0]);
            // 将文件发送到服务器
            $.ajax(
                {
                    url:'http://49.234.82.226:8080/grade_extra/excel',
                    type:'post',
                    dateType:'json',
                    headers: {
                        'Authorization': token,
                    },
                    data:formdata,
                    processData : false,
                    contentType : false,
                    success:function(response){
                        alert(response.msg);
                        $('#import-page').slideUp(500);
                    },
                    error:function(e){
                        alert("导入失败");
                        console.log(e);
                    }
                }
            );
        }
        e.preventDefault();
        
    });

    //设置按钮点击事件: 关闭导入页面
    $('.close-button-import').click(function (e) {
        $('#import-page').slideUp(500); 
        e.preventDefault();
        
    });

    //设置按钮点击事件: 弹出导出页面
    $('#outport').click(function (e) {
        $('.wrapper').hide();
        $('#outport-page').fadeIn(500);
        return false;
    });

    //设置按钮点击事件: 导出excel
    $('#outport-btn').click(function (e) {
        var className = $('#output-choose-class').attr('placeholder');
        if(className=='班级'){
            alert(请选择班级);
        }else{
            var classID = getClassID(className);

            //下载成绩文件
            var url = 'http://49.234.82.226:8080/student/excel/'+classID
            window.location.href = url;

        }
        e.preventDefault();
    });

    //设置按钮点击事件: 关闭导出页面
    $('.close-button-outport').click(function (e) {
        $('#outport-page').slideUp(500); 
        e.preventDefault();
        
    });
    

});

function isLogined(){       //用于初进入页面时判断用户是否已登陆

    token = localstorage.getItem('user_token');
    console.log('第一次'+ token);
    if(token == undefined){
        token = sessionstorage.getItem('user_token');
        console.log('第二次'+ token);
        if(token == undefined){
            //若未登陆，显示登陆弹框
            $('#login-window').show(); 
        }else{
            $('#login-show').text(localstorage.getItem('username'));
            role = localstorage.getItem('role');
            if(role==1){
                $('#operation').show();
            }
            // 若已登陆，进行页面初始化
            initpage();
        }
    }else{
        //求改登录按钮文本
        $('#login-show').text(localstorage.getItem('username'));
        //判断是否为教师，若为教师显示增删改查按钮
        role = localstorage.getItem('role');
        if(role==1){
            $('#operation').show();
        }
        //页面初始化
        initpage();
    }

}

function initpage(){    //初始化页面
    // 向服务器发送请求，返回班级列表
    $.ajax(
        {
            url:'http://49.234.82.226:8080/class/index',
            type:'get',
            dateType:'json',
            async: false,
            headers: {
                'Authorization': token,
                'Content-Type':'application/json;charset=utf-8'
            },
            success:function(response){
                //判断用户权限
                role = localstorage.getItem('role');
                if(role==1){
                    $('#operation').show();
                    $('#add-class').show();
                }
                if(response.msg=='未登录'){
                    console.log('未登录')
                }else{
                    // 初始化班级列表，默认班级为返回的第一个班级
                    classlist = response.class_list;
                    currentClass = classlist[0].class_id;
                    currentClassName = classlist[0].class_name;

                    //初始化标题栏
                    $('.sub-header')[0].childNodes[0].nodeValue = classlist[0].class_name
                    $('.page-header').text(currentCourse);
                    
                    //初始化班级列表
                    $.each(classlist, function (n, value) {
                        var content1 = '<li><a href="#" class="switch-class">' + value.class_name + '</a></li>'
                        var content2 = '<li><a href="#" class="cho-class">' + value.class_name + '</a></li>'
                        $('.divider').before(content1);
                        $('.classList').append(content2);
                    });

                    //初始化表格,初始化额外课程
                    updateList(currentClass, currentCourse);
                }
            },
            error:function(e){
                console.log("error");
                console.log(e);
            }
        }
    );
    return;
}

function addCourse(Course){ //在侧边栏中添加额外课程
    var content = '<li><a href="#" class="extra">' + Course + '</a></li>'
    $('.avg-grade').before(content);
}


function getDBStuID(target){ //传入学生学号，返回学生在数据库中的id
    var result = -1
    $.each(stdentList, function (n, value) {
        if(value.number == target){
            result = value.student_id;
        }
    });
    return result;
}

function exitLogin(){ //退出登陆函数
    //清理token
    localStorage.removeItem('user_token');
    sessionstorage.removeItem('user_token');
    token = undefined;
    // 还原未登录原始界面
    $('#operation').hide();
    $('#add-class').hide();
    $('.wrapper').hide();
    $('tbody').empty();
    $('.extra').remove();
    $('.switch-class').remove();
    $('.classList').empty();
    $('#login-window').show();
    $('#login-show').text('登录');
    $('.sub-header')[0].childNodes[0].nodeValue='班级名';
    $('.page-header').text('课程名');
}

function getClassID(target){ //传入课程中文名，返回课程id
    var result = -1
    $.each(classlist, function (n, value) {
        if(value.class_name == target){
            result = value.class_id;
        }
    });
    return result;
}

function getClassName(target){ //传入课程id，返回课程名
    var result = -1
    $.each(classlist, function (n, value) {
        if(value.class_id == target){
            result = value.class_name;
        }
    });
    return result;
}

function updateList(classID, course){ //更新表格数据，传入当前班级，当前课程，展示学生成绩
    //先清空表格
    $('tbody').empty();
    $('.extra').remove();

    //向服务器发送请求，获取当前班级成绩
    $.ajax(
        {
            url:'http://49.234.82.226:8080/student/class/' + classID,
            type:'get',
            dateType:'json',
            async: false,
            headers: {
                'Authorization': token,
                'Content-Type':'application/json;charset=utf-8'
            },
            success:function(response){
                //更新学生列表
                stdentList = response.student_list;
                extraCourse = response.course_extra;
                if(extraCourse){
                    extra = extraCourse.split(',');
                    $.each(extra, function (index, value) { 
                        addCourse(value);
                    });
                }else{
                    console.log('该班级无额外课程');
                }
                if(stdentList){
                    // 选取当前课程的成绩展示
                    var i=1;
                    //按成绩排序
                    stdentList.sort(sortByGrade(courseReflect[course]));
                    //添加数据到表格
                    $.each(stdentList, function (index, value) {
                         content = "<tr><td>"+ i +"</td><td>"+ value.name+"</td><td>"+value.number+"</td><td>"+value[courseReflect[course]]+"</td></tr>"
                         i = i+1;
                         $('tbody').append(content);
                    });
                }else{
                    console.log('该班级无学生');
                }
            },
            error:function(e){
                console.log("error");
                console.log(e);
            }
        }
    );
    return;
}
function updateExtra(className, course){    //更新额外课程，额外课程和常规课程有区别，只能用文件导入
    $('tbody').empty();
    data={
        "class_name": className,
        "course_extra": course
    }
    //向服务器发送请求
    $.ajax(
        {
            url:'http://49.234.82.226:8080/grade_extra/one',
            type:'post',
            dateType:'json',
            async: false,
            headers: {
                'Authorization': token,
                'Content-Type':'application/json;charset=utf-8'
            },
            data: JSON.stringify(data),
            success:function(response){
                //更新表格数据
                var i=1;
                response.sort(sortByGrade('score'));
                $.each(response, function (index, value) {
                        content = "<tr><td>"+ i +"</td><td>"+ value.student_name+"</td><td>"+value.class_name+"</td><td>"+value.score+"</td></tr>"
                        i = i+1;
                        $('tbody').append(content);
                });
                
            },
            error:function(e){
                console.log("error");
                console.log(e);
            }
        }
    );
    return;
}


function sortByGrade(key){ //排序函数，降序排序
    return function(m,n){
        var a = m[key];
        var b = n[key];
        return b - a; 
    }
}
