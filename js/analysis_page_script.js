var analysis_path="analysis.php?code=";

//////////////////////////////////////////////////////////////
/////// For analysis page:
//////////////////////////////////////////////////////////////

function showProgress() {
    var run_id_code=getUrlVars()["code"];
    var prog=0;
    
//  remember ajax is asynchronous, so only the stuff inside the success: part will be called after retrieving information. If I put something after the statement, it can't use the info from check_progress.php because it is executed before this php script is called
    //alert('before ajax');
    jQuery.ajax({ 
        type:"POST",
        url: "check_progress.php",
        dataType: 'json',
        data: {code: run_id_code},
        success: function (obj) {
            // alert("inside success");
            // alert(obj);
            prog=obj;

            last_line = prog[prog.length-1];

            if (last_line==undefined) {
                console.log("No progress file found, may be an error on the server");
                setTimeout(function(){showProgress();},500);
            } else {
                nickname = prog[0].slice(0,prog[0].length-1); // this cuts off the last character, which is a carriage return we don't want to pass on to the visualizer as GET
                document.getElementById("nickname_header").innerHTML = nickname.replace(/_/g," ");

                output_array = prog.slice(1,prog.length);
                output_info = "Starting..."
                for (var i=0;i < output_array.length; i++) {
                    // sub_array = output_array[i].split(",");
                    output_info += "<p>" + output_array[i] + "</p>";
                }

                document.getElementById("plot_info").innerHTML = output_info

                if (last_line.indexOf('done') > -1) {
                    document.getElementById("progress_panel").className = "panel panel-success center";
                    document.getElementById("results").style.visibility= 'visible';
                    document.getElementById("hidden_fields_and_submit").innerHTML = '<input type="hidden" name="code" value="' + run_id_code + '"><input type="hidden" name="nickname" value="' + nickname + '"><button type="submit" class="btn btn-lg btn-primary">Show visualizer</button>';
                    // check_plot_exists(0);
                }
                else if (last_line.indexOf("fail") > -1) { // SOMETHING FAILED
                    document.getElementById("progress_panel").className = "panel panel-danger center";
                }
                else {
                    setTimeout(function(){showProgress();},500);
                }
            }
        } // end success
   
    });
}



function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}


var content_width = $( window ).width();


$(document).ready(function() {
    showProgress();
    // $(window).bind("resize", function(){ //Adjusts image when browser resized
    //    imageresize();
    // });
});

