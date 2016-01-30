
// Initial Metadata for the menu
// var local = localStorage.getItem("menu");
var DEBUG = false;
var local = { up: undefined };
var menu  = local.up != undefined ? local : {
    up: false,
    user: {
        class: "user",
        curr: 1,
        max: 1
    },
    session: {
        class: "session",
        curr: 1,
        max: 1
    }
};
menu.up = false;
var curr = menu.session;
var currUser;
var message_queue = {
    password: [],
};

function typeWriter(element, text, n, callback) {
    if (n < text.length) {
        element.innerHTML = text.substring(0, n + 1);
        n++;
        setTimeout(function() { typeWriter(element, text, n, callback); }, 50);
    } else {
        callback();
    }
}

function getDefaultUsername() {
    return lightdm.users[menu.user.curr - 1].name;
}

function usernames() {
    users = [];
    for (i in lightdm.users) {
        users.push(lightdm.users[i].name);
    }
    return users;
}

// usernames = function() {
//     return [ "michael", "mark", "amos" ];
// }
//
// getDefaultUsername = function() {
//     return "michael";
// }

/*******************************************
 *                                         *
 *           Debugging Methods!            *
 *                                         *
 *******************************************/
// lightdm = {};
// lightdm.provide_secret = function(pass) {
//     lightdm.is_authenticated = pass == "password";
//     setTimeout(authentication_complete, 1000);
// };
// lightdm.sessions = (function() {
//     var sess = ["kde", "gnome", "xfce", "i3", "bspwn"];
//     var sessions = [];
//     for (i in sess) {
//         sessions.push({
//             name: sess[i],
//             key:  sess[i]
//         });
//     }
//     return sessions;
// })();
// lightdm.users = (function() {
//     var us = [ "michael", "mark", "amos" ];
//     var users = [];
//     for (i in us) {
//         users.push({
//             name: us[i]
//         });
//     }
//     return users;
// })();
// lightdm.login = function(user, session) {};
// lightdm.start_authentication = function() {};
// lightdm.cancel_authentication = function() {};

function login() {
    // get references to objects;
    var uInput = document.getElementById("user");
    var pInput = document.getElementById("pass");

    // Capture credentials
    var user = uInput.value;
    var pass = pInput.value;

    console.log("Logging in with user", user);

    // login n" such
    lightdm.start_authentication(user);

    console.log("Started authentication", user, "...");

    // Some notifications:
    $("#userLbl").html("Signing in...");
    $("#passLbl").html("&nbsp;");

    message_queue.password.push(function() {
        console.log("Sending credentials...");
        return pass;
    });
}

(function() {
    // Don't set this up if we're not in debug mode.
    if (!DEBUG) {
        return;
    }
    $(document).ready(function() {
        $(".debug").show();
    });
    var cache;
    window.console.log = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var message = args.join(" ");
        var logger = document.getElementById("logger");
        if (logger) {
            if (cache) {
                message = cache + "<br/>" + message;
                cache = undefined;
            }
            logger.innerHTML += message + "<br/>";
        } else {
            cache += "<br/>" + message;
        }
    };
})();

window.onerror = function(message, url, line, column, error) {
    // console.log("UNCAUGHT ERROR", JSON.stringify(arguments));
    console.log("UNCAUGHT ERROR", line, ":", column, "@");
};

window.onload = function() {
    console.log("Debugger Ready...");
    for (key in lightdm) {
        console.log(key);
    }
};

function authentication_complete() {
    if (lightdm.is_authenticated) {
        // Pick which environment we want
        $(".container").addClass("animated fadeOut");
        setTimeout(function() {
            // Login the user
            // TODO: Should there be a delay for the fade effect?
            var session = lightdm.sessions[menu.session.curr - 1].key;
            lightdm.login(lightdm.authentication_user, session);
        }, 500);
    } else {
        // Make an error-ing animation
        // TODO: Make the password field highlighted when this happens
        $(".container").attr("class", "container");
        $("#userLbl").html("Username:");
        $("#passLbl").html("Password:");
        $("#pass").attr("class", "mono animated wobble");
        setTimeout(function() {
            $("#pass").attr("class", "mono");
            $("#pass").val("");
        }, 1000);
        updateUser(currUser);
    }
}

function updateUser(username) {
    $("#user").val(username);
    currUser = username;
}

$(document).ready(function() {
    for (i in lightdm.sessions) {
        var active = "";
        if (i == menu.session.curr - 1) {
            active = "selected";
        }
        $(".chooser ul.session").append("<li class='" + active + "'>" + lightdm.sessions[i].name + "</li>");
    }
    menu.session.max = lightdm.sessions.length;

    for (i in lightdm.users) {
        var active = "";
        if (i == menu.user.curr - 1) {
            active = "selected";
        }
        $(".chooser ul.user").append("<li class='" + active + "'>" + lightdm.users[i].name + "</li>");
    }
    menu.user.max = lightdm.users.length;

    typeWriter(document.getElementById("userLbl"), "Username:", 0, function() {
        typeWriter(document.getElementById("passLbl"), "Password:", 0, function() {

            currUser = getDefaultUsername();
            document.getElementById("user").value = currUser;

            inputs = document.getElementsByTagName("input");
            inputs[0].className = "mono animated fadeInUp";
            inputs[1].className = "mono animated fadeInDown";
            inputs[1].focus();
        });
    });

    function changeMenu(increment) {
        var selector = ".chooser ul." + curr.class + " li:nth-child(";

        $(selector + curr.curr + ")").removeClass("selected");
        curr.curr += increment;
        $(selector + curr.curr + ")").addClass("selected");

        // Save to local storage
        localStorage.setItem("menu", menu);
        // Change user name if applicable
        if (curr === menu.user) {
            var user = $(selector + curr.curr + ")").html();
            updateUser(user);
        }
    }

    $(document).keydown(function(event) {
        if (event.which == 17) {
            $(".chooser").attr("class", "chooser animated flipInX");
            menu.up = true;
        } else if (event.which === 37 || event.which === 72) {
            // Left
            if (menu.up && curr === menu.session) {
                curr = menu.user;
            }
        } else if (event.which === 39 || event.which === 76) {
            // Right
            if (menu.up && curr === menu.user) {
                curr = menu.session;
            }
        } else if (event.which === 38 || event.which === 75) {
            // Up
            if (!menu.up || curr.curr <= 1) return;
            changeMenu(-1);
        } else if (event.which === 40 || event.which === 74) {
            // Down
            if (!menu.up || curr.curr >= curr.max) return;
            changeMenu(1);
        }
    });

    $(document).keyup(function(event) {
        if (event.which == 17) {
            $(".chooser").attr("class", "chooser animated fadeOut");
            menu.up = false;
        }
    });

    var login_on_enter = function(event) {
        if (event.which == 13) {
            login();
        }
    };

    // Enter accepts the password
    $("#pass").keypress(login_on_enter);
    $("#user").keypress(login_on_enter);
});

function show_prompt(text, type) {
    console.log("PROMPT " + type + ":", text);
    var listeners = message_queue[type];
    while (listeners.length > 0) {
        var response = (listeners.pop())(text);
        if (response) {
            lightdm.respond(response);
            break;
        }
    }
}
function show_error(text, type) {
    console.log("ERROR" + type + ":", text);
}
