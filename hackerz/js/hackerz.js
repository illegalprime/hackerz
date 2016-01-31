(function() {
    "use strict";
    var DEBUG = false;

    var Log = {};
    var prompt_queue = {
        password: [],
    };
    var menu = {};

    // Make a mock if we're in a browser
    if (!window.lightdm) {
        var auth_start = false;
        window.lightdm = {
            sessions: (function() {
                var session_names = ["kde", "gnome", "xfce", "i3", "bspwn"];
                var sessions = [];
                session_names.forEach(function(session_name) {
                    sessions.push({
                        name: session_name,
                        key:  session_name,
                    });
                });
                return sessions;
            })(),
            users: (function() {
                var usernames = [ "michael", "mark", "amos" ];
                var users = [];
                usernames.forEach(function(username) {
                    users.push({
                        name: username,
                    });
                });
                return users;
            })(),
            start_authentication: function() {
                auth_start = true;
                setTimeout(function() {
                    show_prompt("Password:", "password");
                }, 0);
            },
            respond: function(text) {
                Log.log("response", text);
                if (auth_start) {
                    if (text === "password") {
                        window.lightdm.is_authenticated = true;
                    }
                    setTimeout(function() {
                        authentication_complete();
                    }, 500);
                    auth_start = false;
                }
            },
            login: function() {
                $("body").html("");
            },
        };
    }

    // Generate menu
    (function() {
        menu.sessions = {};
        for (var s = 0; s < lightdm.sessions.length; ++s) {
            menu.sessions[s] = lightdm.sessions[s].name;
        }

        menu.users = {};
        for (var u = 0; u < lightdm.users.length; ++u) {
            menu.users[u] = lightdm.users[u].name;
        }
        // Default user and session
        menu.users.curr = 0;
        menu.sessions.curr = 0;
        menu.users.length = lightdm.users.length;
        menu.sessions.length = lightdm.sessions.length;
        menu.users.element = ".chooser ul.user li";
        menu.sessions.element = ".chooser ul.session li";
        // Most likely going to be changing the session
        menu.column = {
            0: "users",
            1: "sessions",
            curr: 1,
            length: 2,
        };

        menu.update = function() {
            Array.prototype.forEach.call(menu.column, function(column) {
                menu[column].curr = menu[column].curr % menu[column].length;
                if (menu[column].curr < 0) {
                    menu[column].curr += menu[column].length;
                }
                $(menu[column].element).removeClass("selected");
                $(menu[column].element).eq(menu[column].curr).addClass("selected");
            });
            if (menu.users.last !== menu.users.curr) {
                $("#user").val(menu.users[menu.users.curr]);
            }
            menu.users.last = menu.users.curr;
        };
    })();

    var type_writer = function(element, text, n, callback) {
        if (n < text.length) {
            element.html(text.substring(0, n + 1));
            n += 1;
            setTimeout(function() {
                type_writer(element, text, n, callback);
            }, 50);
        } else {
            callback();
        }
    };

    var login = function() {
        // get references to objects;
        var uInput = document.getElementById("user");
        var pInput = document.getElementById("pass");

        // Capture credentials
        var user = uInput.value;
        var pass = pInput.value;

        Log.log("Logging in with user", user);

        // login n" such
        lightdm.start_authentication(user);

        Log.log("Started authentication", user, "...");

        // Some notifications:
        $("#userLbl").html("Signing in...");
        $("#passLbl").html("&nbsp;");

        $("#user").attr("disabled", "disabled");
        $("#pass").attr("disabled", "disabled");

        prompt_queue.password.push(function() {
            Log.log("Sending credentials...");
            return pass ? pass : true;
        });
    };

    window.show_prompt = function(text, type) {
        Log.log("PROMPT " + type + ":", text);
        var listeners = prompt_queue[type];
        while (listeners.length > 0) {
            var response = (listeners.pop())(text);
            if (response) {
                lightdm.respond(response);
                break;
            }
        }
    };

    window.show_error = function(text, type) {
        Log.log("ERROR" + type + ":", text);
    };

    window.onerror = function(message, url, line, column, error) {
        Log.log("UNCAUGHT ERROR", error.stack);
    };

    window.authentication_complete = function() {
        if (lightdm.is_authenticated) {
            // Pick which environment we want
            $(".container").addClass("animated fadeOut");
            setTimeout(function() {
                // Login the user
                var session = menu.sessions[menu.sessions.curr];
                lightdm.login(lightdm.authentication_user, session);
            }, 500);
        } else {
            // Make an error-ing animation
            $(".container").attr("class", "container");
            $("#userLbl").html("Username:");
            $("#passLbl").html("Password:");
            $("#pass").attr("class", "mono animated wobble");
            $("#user").removeAttr("disabled");
            $("#pass").removeAttr("disabled");
            $("#pass").val("");
            $("#pass").focus();
            setTimeout(function() {
                $("#pass").attr("class", "mono");
            }, 1000);
        }
    };

    $(document).ready(function() {
        Log.log("Debugger Ready...");
        Array.prototype.forEach.call(menu.sessions, function(session) {
            $(".chooser ul.session").append("<li>" + session + "</li>");
        });
        Array.prototype.forEach.call(menu.users, function(user) {
            $(".chooser ul.user").append("<li>" + user + "</li>");
        });
        menu.update();

        type_writer($("#userLbl"), "Username:", 0, function() {
            type_writer($("#passLbl"), "Password:", 0, function() {
                $("#user").addClass("mono animated fadeInUp");
                $("#pass").addClass("mono animated fadeInDown");
                $("#user, #pass").removeClass("hide");
                $("#pass").focus();
            });
        });

        $(document).keydown(function(event) {
            if (event.which === 13) {
                login();
            } else if (!event.ctrlKey) {
                // We must be holding it down to edit the settings
                return;
            }
            if (event.which == 17) {
                $(".chooser").attr("class", "chooser animated flipInX");
            } else if (event.which === 37 || event.which === 72) { // Left
                menu.column.curr -= 1;
            } else if (event.which === 39 || event.which === 76) { // Right
                menu.column.curr += 1;
            } else if (event.which === 38 || event.which === 75) { // Up
                menu[menu.column[menu.column.curr]].curr -= 1;
            } else if (event.which === 40 || event.which === 74) { // Down
                menu[menu.column[menu.column.curr]].curr += 1;
            }
            menu.update();
        });

        $(document).keyup(function(event) {
            if (event.which == 17) {
                $(".chooser").attr("class", "chooser animated fadeOut");
            }
        });
    });

    (function() {
        // Don't set this up if we're not in debug mode.
        if (DEBUG) {
            $(document).ready(function() {
                $(".debug").show();
            });
            var cache;
            Log.log = function() {
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
        } else {
            Log.log = function() {};
        }
    })();
})();
