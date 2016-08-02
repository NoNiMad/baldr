var count;

function hideOneFlash() {
    var last = $("#flashmsg li").last();
    last.animate({
        opacity: 0
    }, 500, 'swing', function() {
        last.remove();
    })
    count--;
    if(count > 0) {
        setTimeout(hideOneFlash, 1500);
    }
}

$(document).ready(function() {
    count = $("#flashmsg li").size();
    setTimeout(hideOneFlash, 2000);
});
