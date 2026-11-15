// The round's given code: correct but slow (used by verify.js --speed).
function countSessions(events, gap) {
    var result = [];
    var users = [];
    for (var i = 0; i < events.length; i++) {
        if (users.indexOf(events[i][0]) === -1) users.push(events[i][0]);
    }
    users.sort(function (a, b) { return a - b; });
    for (var k = 0; k < users.length; k++) {
        var u = users[k];
        var times = [];
        for (var i = 0; i < events.length; i++) {
            if (events[i][0] === u) times.push(events[i][1]);
        }
        for (var a = 0; a < times.length; a++) {
            for (var b = 0; b < times.length - 1 - a; b++) {
                if (times[b] > times[b + 1]) {
                    var tmp = times[b]; times[b] = times[b + 1]; times[b + 1] = tmp;
                }
            }
        }
        var count = 0;
        var last = null;
        for (var j = 0; j < times.length; j++) {
            if (last === null || times[j] - last > gap) count = count + 1;
            last = times[j];
        }
        result.push([u, count]);
    }
    return result;
}
