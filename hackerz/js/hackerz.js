(function() {
    // Initial Metadata for the menu
    var local = localStorage.getItem("menu");
    // var local = undefined;
    var menu  = local.up != undefined ? local : {
        up: false,
        user: {
            class: "user",
            curr: 1,
            max: 1
        },
        session: {
            class: "session",
            curr: 4,
            max: 1
        }
    };
    menu.up = false;
    var curr = menu.session;
    var currUser;

    function typeWriter(element, text, n, callback) {
        if (n < text.length) {
            element.innerHTML = text.substring(0, n + 1);
            n++;
            setTimeout(function() { typeWriter(element, text, n, callback); }, 50);
        }
        else {
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

    function login() {
        // get references to objects;
        var uInput = document.getElementById("user");
        var pInput = document.getElementById("pass");
        // TODO: Pick session: var sInput = document.getElementBy

        // Capture credentials
        var user = uInput.value;
        var pass = pInput.value;

        // login n' such
        lightdm.provide_secret(pass);

        // Some notifications:
        $("#userLbl").html("Logging In...");
        $("#passLbl").html("&nbsp;");
    }

    function authentication_complete() {
        var container = document.getElementsByClassName("container")[0];
        if (lightdm.is_authenticated) {
            // Fade out login screen
            container.className = "animated fadeOut";
            // Pick which environment we want
            var session = lightdm.sessions[menu.session.curr - 1].key;
            // Login the user
            lightdm.login(lightdm.authentication_user, session);
        }
        else {
            // Make an erroring animation
            // TODO: Make the password feild highlighted when this happends
            container.className = "animated shake";
        }
    }

    window.onload = function() {
        for (i in lightdm.sessions) {
            var active = "";
            if (i == menu.session.curr - 1) {
                active = "selected";
            }
            $(".chooser ul.session").append("<li class='" + active + "' >" + lightdm.sessions[i].name + "</li>");
        }
        menu.session.max = lightdm.sessions.length;

        for (i in lightdm.users) {
            var active = "";
            if (i == menu.user.curr - 1) {
                active = "selected";
            }
            $(".chooser ul.user").append("<li class='" + active + "'  >" + lightdm.users[i].name + "</li>");
        }
        menu.user.max = lightdm.users.length;

        typeWriter(document.getElementById("userLbl"), "Username:", 0, function() {
            typeWriter(document.getElementById("passLbl"), "Password:", 0, function() {

                currUser = getDefaultUsername();
                document.getElementById("user").value = currUser;

                inputs = document.getElementsByTagName('input');
                inputs[0].className = "mono animated fadeInUp";
                inputs[1].className = "mono animated fadeInDown";
                inputs[1].focus();

                lightdm.cancel_authentication();
                lightdm.start_authentication(currUser);
            });
        });

        $(document).keydown(function(event) {
            if (event.which == 17) {
                $(".chooser").attr("class", "chooser animated flipInX");
                menu.up = true;
            }
            else if (event.which == 37) {
                // Left
                if (menu.up && curr === menu.session) {
                    curr = menu.user;
                }
            }
            else if (event.which == 39) {
                // Right
                if (menu.up && curr === menu.user) {
                    curr = menu.session;
                }
            }
            else if (event.which == 38) {
                // Up
                if (!menu.up || curr.curr <= 1) {
                    return;
                }
                var selector = ".chooser ul." + curr.class + " li:nth-child(";
                $(selector + curr.curr + ")").removeClass("selected");
                
                curr.curr -= 1;
                $(selector + curr.curr + ")").addClass("selected");

                // Save to local storage
                localStorage.setItem("menu", menu);

                // Change user name if applicable
                if (curr === menu.user) {
                    // TODO: Change users.
                    // $("#user").val(
                }
            }
            else if (event.which == 40) {
                // Down
                if (!menu.up || curr.curr >= curr.max) {
                    return;
                }
                var selector = ".chooser ul." + curr.class + " li:nth-child(";
                $(selector + curr.curr + ")").removeClass("selected");

                curr.curr += 1;
                $(selector + curr.curr + ")").addClass("selected");

                // Save to local storage
                localStorage.setItem("menu", menu);
            }
        });
        $(document).keyup(function(event) {
            if (event.which == 17) {
                $(".chooser").attr("class", "chooser animated fadeOut");
                menu.up = false;
            }
        });

        // Enter accepts the password
        $("#pass").keypress(function(event) {
            if (event.which == 13) {
                login();
            }
        });
        $("#user").keypress(function(event) {
            if (event.which == 13) {
                login();
            }
        });
    };
})();