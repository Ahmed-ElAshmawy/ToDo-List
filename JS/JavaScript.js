var db = openDatabase('TodoDB', '1.0', 'Todo', 2 * 1024 * 1024);
db.transaction(function (tx) {
    tx.executeSql('create table if not exists Tasks (name unique,description,status)')
    tx.executeSql('INSERT INTO Tasks VALUES ("T1","T1Desc","completed")');  
    tx.executeSql('INSERT INTO Tasks VALUES ("T2","T2Desc","notcompleted")'); 
    tx.executeSql('INSERT INTO Tasks VALUES ("T3","T3Desc","completed")');
    tx.executeSql('INSERT INTO Tasks VALUES ("T4","T4Desc","notcompleted")');
    tx.executeSql('create table if not exists Login (name unique,pass)')
    tx.executeSql('INSERT INTO Login VALUES ("H","123")');    
});
var f = 0;
var max;
var operation = {
    InsertTask: function (task) {
        db.transaction(function (tx) {
            tx.executeSql('INSERT INTO Tasks VALUES (?,?,?)', [task.name, task.description, task.status]);
        })
    },
    getAll: function () {
        return new Promise(function (resolve, reject) {
            db.transaction(function (tx) {
                tx.executeSql('SELECT *,rowid FROM Tasks', [], function (tx, results) {
                    if (results.rows.length) {
                        resolve(results.rows);
                    }
                    else {
                        reject({ status: error, message: 'No Tasks' });
                    }
                })
            })

        })
    },
    DeleteTask: function (id) {
        db.transaction(function (tx) {
            tx.executeSql('delete from Tasks where rowid=?', [id]);
        })
    },
    UpdateTask: function (id, name, desc) {
        db.transaction(function (tx) {
            tx.executeSql('update Tasks set name="' + name + '" , description="' + desc + '"  where rowid=?', [id]);
        })
    },
    UpdateState: function (id, state) {
        db.transaction(function (tx) {
            tx.executeSql('update Tasks set status="' + state + '" where rowid=?', [id]);
        })
    }
};
function draw() {
    operation.getAll().then(function (results) {
        for (i = 0; i < results.length; i++) {
            if (results[i].status == 'completed') {
                $(".completed").append("<div id='div" + results[i].rowid + "' ondblclick='conv_div(\"" + results[i].rowid + "\")'>\
            <h3>"+ results[i].name + "</h3>\
            <p>"+ results[i].description + "</p>\
            <a id='tag"+ results[i].rowid + "' onclick='details_div(\"" + results[i].rowid + "\")' >Details</a>\
            <img src='1.png'  id='img"+ results[i].rowid + "' onclick='delete_div(\"" + results[i].rowid + "\")'/>\
            <button class='btn' type='button'>Update</button>\
            <button class='btn'' type='button'>Cancel</button>\
            </div>")
            }
            else {
                $(".notcompleted").append("<div id='div" + results[i].rowid + "' ondblclick='conv_div(\"" + results[i].rowid + "\")'>\
            <h3>"+ results[i].name + "</h3>\
            <p>"+ results[i].description + "</p>\
            <a id='tag"+ results[i].rowid + "' onclick='details_div(\"" + results[i].rowid + "\")' >Details</a>\
            <img src='1.png'  id='img"+ results[i].rowid + "' onclick='delete_div(\"" + results[i].rowid + "\")'/>\
            <button class='btn' type='button'>Update</button>\
            <button class='btn'' type='button'>Cancel</button>\
            </div>")
            }
        }
        max = results[i - 1].rowid
        $(".completed div,.notcompleted div").effect("bounce", { times: 2 }, "slow")
    });
}
$(document).ready(function () {
    if (localStorage.getItem("in") == null) {
        $("#container,#logout,#search").hide();
        $("#login").show();
    }
    else { $("#login").hide(); }
    draw();
    $("#error").dialog({
        autoOpen: false,
        height: 100,
        width: 350,
        modal: true,
        closeText:"",
        title: "Error",
        position: { my: "top+20%", at: "top", of: window },
        show: "blind",
        hide: "blind",
        buttons: {
            "OK": function () {
                $('#error').dialog('close')
            }
        }
    })
    $("#logbtn").click(function () {
        if ($("#logname").val() == "" && $("#logpass").val() == "") {
            $("input").addClass("error");
        }
        else {
            $("input").removeClass("error");
            db.transaction(function (tx) {
                tx.executeSql('SELECT * from Login where name=? and pass=?', [$("#logname").val(), $("#logpass").val()], function (tx, results) {
                    if (results.rows.length > 0) {
                        $("#container,#logout,#search").show();
                        $("#login").hide();
                        localStorage.setItem("in", "1");
                        $(".completed div,.notcompleted div").effect("bounce", { times: 2 }, "slow")
                    }
                    else {
                        $('#error').dialog('open')
                    }
                })
            })
        }

    })
    $("#logname").keyup(function () {
        if ($(this).val().length > 0) {
            $("#logname").addClass("good");
            $("#logpass").addClass("good");
        }
        else {
            $(this).removeClass("good");
            $("#logpass").removeClass("good");
        }
    });
$("#search").keyup(function(){
    var s=$("#search").val()
    $(".completed h3:not(:contains("+s+")),.notcompleted h3:not(:contains("+s+"))").parent().hide();
    $(".completed h3:contains("+s+"),.notcompleted h3:contains("+s+")").parent().show();
    if(s.length === 0){
        $(".completed,.notcompleted,#add_item,#text1,#text").show();
        $(".completed,.notcompleted").empty();
        draw();
    }
})
    $("#logout").click(function () {
        localStorage.removeItem("in")
        $("#container,#logout,#search").hide();
        $("#login").show();
        $("#logname,#logpass").val("");
        $("#logname,#logpass").removeClass("good");
    })

    $(".completed,.notcompleted").sortable({
        connectWith: ".completed,.notcompleted",
        start: function (event, ui) {
        },
        stop: function (event, ui) {
            ui.item.effect("bounce", { times: 2 }, "slow")
            var x = ui.item.attr('id')[3];
            var y = ui.item.parent().parent().attr('class').split(' ')[0];
            operation.UpdateState(x, y)
        }
    });
    $(".completed,.notcompleted").disableSelection();
    $("#caution").dialog({
        autoOpen: false,
        height: 200,
        width: 350,
        title: "Caution",
        modal: true,
        closeText:"",
        position: { my: "top+20%", at: "top", of: window },
        show: "blind",
        hide: "blind",
        buttons: {
            "Yes": function () {
                var id = $("#caution").data('id')
                $("#img" + id).parent().effect('explode', 500);
                f = 0;
                operation.DeleteTask(id);
                $(".completed,.notcompleted,#add_item,#text1,#text").show();
                $(".completed,.notcompleted").empty();
                draw();
                $('#caution').dialog('close')
            },
            Cancel: function () {
                $('#caution').dialog('close')
            }
        }
    });
    $("#dialog").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        title: "Add new todo item",
        modal: true,
        closeText:"",
        position: { my: "top+20%", at: "top", of: window },
        show: "blind",
        hide: "blind",
        buttons: {
            "Add Item": function () {
                var check;
                var newid = max
                var elem = "<div id='div" + newid + "' ondblclick='conv_div(\"" + newid + "\")'>\
            <h3>"+ $("#title").val() + "</h3>\
            <p>"+ $("#desc").val() + "</p>\
            <a id='tag"+ newid + "' onclick='details_div(\"" + newid + "\")' >Details</a>\
            <img src='1.png'  id='img"+ newid + "' onclick='delete_div(\"" + newid + "\")'/>\
            <button class='btn' type='button'>Update</button>\
            <button class='btn'' type='button'>Cancel</button>\
            </div>"
                if ($("#radcom")[0].checked) {
                    $(".completed").append(elem);
                    check = "completed";
                }
                else {
                    $(".notcompleted").append(elem);
                    check = "notcompleted";
                }
                $("#div" + newid).effect("bounce", { times: 2 }, "slow")
                task = {
                    name: $("#title").val(),
                    description: $("#desc").val(),
                    status: check
                }
                operation.InsertTask(task)
                $("#title,#desc").val("")
                $('#dialog').dialog('close')
            },
            Cancel: function () {
                $("#title,#desc").val("")
                $('#dialog').dialog('close')
            }
        }
    });

    $("#add_item").click(function () {
        max = max + 1;
        $("#dialog").dialog("open");
    });
})

function conv_div(id) {
    f++;
    var val;
    var desc;
    var selecdiv = $("#div" + id);
    if (f == 1) {
        val = selecdiv.find("h3").text();
        desc = selecdiv.find("p").text()
        selecdiv.find('h3').replaceWith("<input type='text' value='" + val + "'>");
        selecdiv.find('p').replaceWith("<input type='text' value='" + desc + "'>");
        selecdiv.find('button').removeClass("btn");
        selecdiv.find('button').click(function () {
            if ($(this).text() == "Update") {
                var val2 = selecdiv.find('input')[0].value;
                var descnew = selecdiv.find('input')[1].value;
                selecdiv.find('input').first().replaceWith('<h3>' + val2 + '</h3>');
                selecdiv.find('input:nth-child(2)').replaceWith('<p>' + descnew + '</p>');
                val = val2;
                desc = descnew;
                operation.UpdateTask(id, val2, descnew);
            }
            else if ($(this).text() == "Cancel") {
                selecdiv.find('input').first().replaceWith('<h3>' + val + '</h3>');
                selecdiv.find('input:nth-child(2)').replaceWith('<p>' + desc + '</p>');
            }
            selecdiv.find('button').addClass("btn");
            f = 0;
        })
    }
}

function delete_div(id) {
    $("#caution").data('id', id).dialog("open");
}
function details_div(id) {
    $("#tag" + id).hide();
    $("#tag" + id).parent().parent().siblings('div').hide()
    $("#tag" + id).parent().nextAll().hide();
    $("#tag" + id).parent().prevAll().hide();
    $("#add_item").hide();
    $("#tag" + id).parent().css('width', '600px');
}
