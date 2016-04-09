
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

var run_id_code=getUrlVars()["code"];

var directory="user_data/" + run_id_code + "/";
var config_path="user_uploads/" + run_id_code + ".config";
var nickname=getUrlVars()["nickname"];

console.log("directory:" + directory);
console.log("nickname:" + nickname);

var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0];

var svg_width;
var svg_height;

var top_edge_padding;
var bottom_edge_padding;
var left_edge_padding;
var right_edge_padding;
var between_circos_and_zoom_plots_padding;

var circos_size;

var radius;


var svg;

var both_zoom_canvas_height;
var both_zoom_left_x_coordinate;
var both_zoom_canvas_width;


var circos_canvas;
var chrom_label_size;

var top_zoom_container;
var bottom_zoom_container;

var bottom_zoom_canvas_top_y_coordinate;

var panel_top_position;
var panel_height;
var panel_width;

var panel_canvas;



////////////////////////////////////            DRAWING              ///////////////////////////////////////////



function responsive_sizing() {

  svg_width = (w.innerWidth || e.clientWidth || g.clientWidth)*0.98;
  svg_height = (w.innerHeight || e.clientHeight || g.clientHeight)*0.96;

  top_edge_padding = svg_width*0.08; 
  bottom_edge_padding = svg_width*0.04; 
  left_edge_padding = svg_width*0.02; 
  right_edge_padding = svg_width*0.02; 
  between_circos_and_zoom_plots_padding = svg_width*0.02; 

  circos_size = Math.min(svg_width,svg_height)*0.65;

  radius = circos_size / 2 - left_edge_padding;

  ////////  Clear the svg to start drawing from scratch  ////////
  
  d3.selectAll("svg").remove()

  ////////  Create the SVG  ////////
  svg = d3.select("body")
    .append("svg:svg")
    .attr("width", svg_width)
    .attr("height", svg_height)


  both_zoom_canvas_height = (svg_height-top_edge_padding-bottom_edge_padding)/3;
  both_zoom_left_x_coordinate = circos_size + between_circos_and_zoom_plots_padding;
  both_zoom_canvas_width = svg_width-both_zoom_left_x_coordinate-right_edge_padding;



  ////////  Top zoom plot  ////////

  top_zoom_container = svg.append("g")
    // .attr("class","top_zoom_container")
    .attr("transform","translate(" + both_zoom_left_x_coordinate + "," + top_edge_padding + ")")

  ////////  Bottom zoom plot  ////////

  bottom_zoom_canvas_top_y_coordinate = svg_height-bottom_edge_padding-both_zoom_canvas_height;

  bottom_zoom_container = svg.append("g")
    // .attr("class","bottom_zoom_container")
    .attr("transform","translate(" + both_zoom_left_x_coordinate + "," + bottom_zoom_canvas_top_y_coordinate + ")")


  ////////  Set up circos canvas  ////////
  circos_canvas = svg.append("svg:g")
    // .attr("class","circos_canvas")
    .attr("transform", "translate(" + (radius+left_edge_padding) + "," + (radius+top_edge_padding) + ")")

  chrom_label_size = radius/5;


  ////////  Set up panel canvas  ////////

  panel_top_position = radius*2+top_edge_padding+between_circos_and_zoom_plots_padding;
  panel_height = svg_height - panel_top_position - bottom_edge_padding;
  panel_width = radius*2 - between_circos_and_zoom_plots_padding;

  panel_canvas = svg.append("g")
    .attr("transform", "translate(" + left_edge_padding + "," + panel_top_position + ")")
}

responsive_sizing();




////////////////////////////////////            DATA              ///////////////////////////////////////////

var chromosomes = []; //["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","X","Y"];
var chromosome_colors = ["#ffff00","#ad0000","#bdadc6", "#00ffff", "#e75200","#de1052","#ffa5a5","#7b7b00","#7bffff","#008c00","#00adff","#ff00ff","#ff0000","#ff527b","#84d6a5","#e76b52","#8400ff","#6b4242","#52ff52","#0029ff","#ffffad","#ff94ff","#004200","gray","black"];

// Custom color scale to match karyotype
var color = d3.scale.ordinal()
    .domain(chromosomes) // input domain
    .range(chromosome_colors); // output range


var genome_size_total = 0;

var pixels_per_bin = 1; 

var plot_spansplit_counts = false;
var segment_copy_number = false;


var chromosome_start_positions = []
var chromosome_position_scale = d3.scale.ordinal()
  .domain(chromosomes)
  .range(chromosome_start_positions)


var genome_data = [];
var coverage = null;

var top_chrom_coverage_data = null;
var bottom_chrom_coverage_data = null;

var connection_data = null;
var boxes_data = [];
var annotation_data = null;
var gene_fusion_data = null;

var annotation_genes_available = null;


var genes_to_show = [];
var relevant_annotation = [];


var top_zoom_chromosome = null;
var bottom_zoom_chromosome = null;

//////////   Set up zoom top canvas and scales //////////

// var top_zoom_canvas = top_zoom_container.append("g");

top_zoom_container.on("mouseover",function(){
  hover_plot = "top";
});

var top_zoom_canvas = null;

var fraction_y_scale_height = 1.4;

var top_zoom_x_scale = d3.scale.linear();
var top_zoom_y_scale = d3.scale.linear();


var genomic_bins_per_zoom_top_bin = null;
var top_bins_per_bar = 5;



//////////   Set up zoom bottom canvas and scales //////////


bottom_zoom_container.on("mouseover",function(){
    hover_plot = "bottom";
  })
// var bottom_zoom_canvas = bottom_zoom_container.append("g");
var bottom_zoom_canvas = null;

var bottom_zoom_x_scale = d3.scale.linear();
var bottom_zoom_y_scale = d3.scale.linear();


var genomic_bins_per_zoom_bottom_bin = null;
var bottom_bins_per_bar = 5;


////////// Set up dragging behavior for chromosome selection //////////////

var dragging_chromosome = null; // Which chromosome are you dragging from the circos plot?
var hover_plot = null; // Which plot (top or bottom) are you about to drop the chromosome onto?

var coverage_done = false;
var spansplit_done = false;
var boxes_done = false;
var annotation_done = false;



/////////  Gene fusions  /////////////

// var gene_fusion_to_highlight = null;
var variants_to_highlight = [];
var color_for_highlighted_connections = "black";

//////////   Evolution boxes   /////////////

var box_colors = d3.scale.category20();

var show_boxes = true;



////////// Calculate polar coordinates ///////////

var genome_to_angle = function(chromosome,position) {
  var start_position_of_this_chromosome = chromosome_position_scale(chromosome);

  return ((start_position_of_this_chromosome+position)/genome_size_total)*2*Math.PI;
}

var genome_to_circos_x = function(chromosome,position) {
  return (Math.cos(genome_to_angle(chromosome,position) - (Math.PI/2)));
}
var genome_to_circos_y = function(chromosome,position) {
  return (Math.sin(genome_to_angle(chromosome,position) - (Math.PI/2)));
}

///////////   Style connections and spansplit lines on the zoom plots   ///////////////

var stub_height = 10;
var spansplit_bar_length = 10;
var loop_height = 25;


var top_loop_scale = d3.scale.linear()
  .domain([1000000,100000000])
  .range([loop_height,bottom_zoom_canvas_top_y_coordinate-both_zoom_canvas_height-top_edge_padding])
  .clamp(true)

var bottom_loop_scale = d3.scale.linear()
  .domain([1000000,100000000])
  .range([loop_height,bottom_zoom_canvas_top_y_coordinate-both_zoom_canvas_height-top_edge_padding])
  .clamp(true)

///////////   Add tooltips   /////////////////


// var box_tip = function() {console.log("No d3.tip offline")}
// var variant_tip = function() {console.log("No d3.tip offline")};

var box_tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "" + d.height + " reads";
  }
)
var variant_tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    // return "<strong>Reads: </strong>" + d.split + "";
    return "" + d.split + " reads"; // + " Flow: "+  d.flow_category + "";
  }
)

svg.call(box_tip);
svg.call(variant_tip);


///////////  Run the whole program by loading all files and when they are loaded drawing everything ///////////

var run = function(){
  populate_navbar();

  read_config_file();
  read_genome_file();
  read_coverage_file();
  read_spansplit_file();
  read_splitthreader_boxes_file();

  
  // read_fusion_report_file();
  // show_oncogene_dropdown();
  message_to_user("Loading data");
  wait_then_run_when_all_data_loaded();
}

var draw_everything = function() {
    draw_circos();
    draw_top_zoom();
    draw_bottom_zoom();
    draw_connections();  
    draw_circos_connections();
}


function wait_then_run_when_all_data_loaded() {
  console.log("checking")
  if (coverage_done & spansplit_done) {
    console.log("ready")
    draw_everything();
    message_to_user("Loading data is complete")
  } else {
    console.log("not yet")
    window.setTimeout(wait_then_run_when_all_data_loaded,300)  
  }
}

///////////   Make these adjustable by user   ////////////

var max_zoom = 50; //Max number of pixels a genomic bin can be zoomed to (used to be 1 pixel per bin, this allows greater zooming to see variants even if coverage information doesn't go down below 1 pixel per bin)

///////////////////////////   Read input files   //////////////////////////////////
// Set default configuration
var config = {};
config["min_variant_size"] = 0;
config["min_split_reads"] = 0;
config["annotation"] = "";


var read_config_file = function() {
  d3.csv(config_path, function(error,config_input) {
    if (error) throw error;
    for (var i=0;i<config_input.length;i++){
      console.log(config_input[i]);
      if (isNaN(config_input[i].val)) {
        config[config_input[i].parameter] = config_input[i].val; // string doesn't contain a number
      } else {
        config[config_input[i].parameter] = +config_input[i].val; // string does contain a number
      }
    }
    console.log(config);
    read_annotation_file();
  });
}



var read_genome_file = function() {
    d3.csv(directory + nickname + ".genome.csv", function(error,genome_input) {
    if (error) throw error;
    
    var sum_genome_size = 0;
    for (var i=0;i<genome_input.length;i++){
      genome_input[i].size = +genome_input[i].size;
      sum_genome_size += genome_input[i].size;
      // console.log(genome_input[i].chromosome);
    }

    genome_data = [];  // set global variable for accessing this elsewhere
    for (var i=0; i< genome_input.length;i++) {
      if (genome_input[i].size > sum_genome_size*0.01){ //only include chromosomes accounting for at least 1% of the total genome sequence
        genome_data.push({"chromosome":genome_input[i].chromosome, "size":genome_input[i].size})
      }
    }

    draw_circos();

    });
}

var read_splitthreader_boxes_file = function() {
  d3.csv(directory + nickname + ".SplitThreader.evolution.csv?id=" + Math.random(), function(error,boxes_input) {
    if (error) throw error;
    
    for (var i=0; i<boxes_input.length; i++){
      boxes_input[i].start = +boxes_input[i].start
      boxes_input[i].end = +boxes_input[i].end
      boxes_input[i].y_start = +boxes_input[i].y_start
      boxes_input[i].height = +boxes_input[i].height
    }

    boxes_data = boxes_input;
    boxes_done = true;
    show_boxes = true;
    
    console.log("finished reading in boxes data")
  });
}


/////////////////   Load coverage  ////////////////////////////////
var read_coverage_file = function() {
    d3.csv(directory + nickname + ".copynumber.csv?id=" + Math.random(), function(error,coverage_input) {

      if (error) throw error;

      for (var i=0;i<coverage_input.length;i++) {
        // Make columns numerical:
        coverage_input[i].start = +coverage_input[i].start
        coverage_input[i].end = +coverage_input[i].end
        coverage_input[i].unsegmented_coverage = +coverage_input[i].coverage // fix until we have both unsegmented and segmented coverage again
        // coverage_input[i].unsegmented_coverage = +coverage_input[i].unsegmented_coverage
        // coverage_input[i].coverage = +coverage_input[i].coverage
        
      }
      coverage = coverage_input; // set global variable for accessing this elsewhere
      top_zoom_chromosome = "17";//coverage[0].chromosome;
      bottom_zoom_chromosome = "8"; //coverage[0].chromosome;


      coverage_done = true;
      
    });
}

var read_spansplit_file = function() {
  d3.csv(directory + nickname + ".variants.csv?id=" + Math.random(), function(error,spansplit_input) {
    // chrom1,pos1,chrom2,pos2,variant_name,strand1,strand2,split,span1,span2,flow_category,description
    if (error) throw error;

    for (var i=0;i<spansplit_input.length;i++) {
      spansplit_input[i].start1 = +spansplit_input[i].start1 
      spansplit_input[i].start2 = +spansplit_input[i].start2
      spansplit_input[i].stop1 = +spansplit_input[i].stop1 
      spansplit_input[i].stop2 = +spansplit_input[i].stop2
      spansplit_input[i].pos1 = (spansplit_input[i].start1+spansplit_input[i].stop1)/2
      spansplit_input[i].pos2 = (spansplit_input[i].start2+spansplit_input[i].stop2)/2
      spansplit_input[i].split = +spansplit_input[i].split;
      // spansplit_input[i].span1 = +spansplit_input[i].span1
      // spansplit_input[i].span2 = +spansplit_input[i].span2
    }
    connection_data = spansplit_input;

    
    spansplit_done = true;
  });
}

var read_annotation_file = function() {
  if (config["annotation"] != "") {
    console.log("Reading annotation");

    d3.csv(config["annotation"], function(error,annotation_input) {

      if (error) throw error;

      annotation_genes_available = []
      for (var i=0;i<annotation_input.length;i++) {
        annotation_input[i].start = +annotation_input[i].start
        annotation_input[i].end = +annotation_input[i].end
        annotation_genes_available.push(annotation_input[i].gene)
      }
      annotation_data = annotation_input;
      annotation_done = true;
    });
  } else {
    console.log("No annotation chosen");
  }
}


// var read_fusion_report_file = function() {
//   d3.csv(directory+"SplitThreader.fusion_report.csv", function(error,fusions_input) {

//     if (error) throw error;

//     for (var i=0;i<fusions_input.length;i++) {
//       fusions_input[i].variant_count = +fusions_input[i].variant_count
//      ///// fusions_input[i].variant_names = fusions_input[i].variant_names.split("|") // produces an array of the variant names
//     }
//     gene_fusion_data = fusions_input;
//     show_gene_fusion_dropdown();
//   });
// }

//////////////  Handle dragging chromosomes from circos onto zoom plots to select chromosomes to show /////////////////

function dragmove(d) {

  var current_translate = d3.select(this).attr("transform").split("(")[1].split(")")[0].split(",");
  var current_x = Number(current_translate[0]);
  var current_y = Number(current_translate[1]);

  var now_x = current_x + d3.event.dx;
  var now_y = current_y + d3.event.dy;
  // var now_x = d3.mouse(this)[0];
  // var now_y = d3.mouse(this)[1];
  // var current_x = d3.select(this).attr("transform")
  // var current_y = d3.select(this).attr("y");

  d3.select(this)
    // .attr("x", function(d){ return (Number(current_x) + d3.event.dx)})
    // .attr("y", function(d){ return (Number(current_y) + d3.event.dy)})
    .attr("transform", "translate(" + now_x + "," + now_y + ")")

}


////////////   Draw circos plot chromosome labels  ////////////

var draw_circos = function() {
    genome_size_total = 0;
    for (var i = 0; i < genome_data.length; i++) {
      chromosome_start_positions.push(genome_size_total); 
      genome_size_total += genome_data[i].size; 
    }

    ///////////////////// Set up circos plot ////////////////////////////
        
    var drag = d3.behavior.drag()
      .origin(function(d){return d;})
      .on("dragstart",function(d) {
        // console.log("dragstart")
        // console.log(d.chromosome)
        hover_plot = null; // reset hover_plot so we only detect mouseover events after the chromosome has been picked up
        dragging_chromosome = d.chromosome;
        d3.event.sourceEvent.stopPropagation();

      })
      .on("drag", dragmove)
      .on("dragend", function(d) {
        // return chromosome (arc) to its original position
        d3.select(this)
          .attr("transform",function(d) {
              return "translate(0,0)" // return the chromosome label to its original position
            })

        // Put the chromosome onto the plot it was dropped on (top or bottom)
        if (hover_plot == "top") {
          select_chrom_for_zoom_top(dragging_chromosome)
          console.log("Switch top to " + dragging_chromosome)
        }
        else if (hover_plot == "bottom") {
          select_chrom_for_zoom_bottom(dragging_chromosome);
          console.log("Switch bottom to " + dragging_chromosome)
        }
        dragging_chromosome = null;
      })

    //////////////////  Load connections and plot them on circos ////////////////////////////

    var chromosome_labels = circos_canvas.selectAll("g.circos_chromosome")
      .data(genome_data)
      .enter()
        .append("g")
          .attr("class","circos_chromosome")
          .attr("transform","translate(0,0)")
          .call(drag);

    var arc = d3.svg.arc(d)
        .outerRadius(radius)
        .innerRadius(radius-chrom_label_size)
        .startAngle(function(d){return genome_to_angle(d.chromosome,0)})
        .endAngle(function(d){return genome_to_angle(d.chromosome,d.size)})


    chromosome_labels.append("path")
        .attr("fill", function(d) { return color(d.chromosome); } ) //set the color for each slice to be chosen from the color function defined above
        .attr("d", arc)
        // .call(drag)

    chromosome_labels.append("text")
      .attr("transform",function(d) {
        d.innerRadius = 0
        d.outerRadius = radius;
        return "translate(" + arc.centroid(d) + ")";
      })
       .attr("text-anchor", "middle")
        .attr("dominant-baseline","middle")
        .attr("class","chromosome_label")
        .text(function(d, i) { return d.chromosome; })
        // .call(drag)
}

///////////    Add connections to the circos plot   /////////////////////
function draw_circos_connections() {
  var connection_point_radius = radius - chrom_label_size;




  var circos_connection_path_generator = function(d) {

    var x1 = connection_point_radius*genome_to_circos_x(d.chrom1,d.pos1),
        y1 = connection_point_radius*genome_to_circos_y(d.chrom1,d.pos1),

        x2 = connection_point_radius*genome_to_circos_x(d.chrom2,d.pos2),
        y2 = connection_point_radius*genome_to_circos_y(d.chrom2,d.pos2);

    var xmid = 0,
        ymid = 0;
    
    return (
         "M " + x1                          + "," + y1 
     + ", S " + xmid                        + "," + ymid + "," + x2                          + "," + y2)
  }

  circos_canvas.selectAll("path.circos_connection").remove()


  circos_canvas.selectAll("path.circos_connection")
    .data(connection_data)
    .enter()
    .append("path")
    .filter(function(d){
      var variant_size = Math.abs(d.pos2-d.pos1);
      return d.split > config["min_split_reads"] && (variant_size > config["min_variant_size"] || d.chrom1 != d.chrom2);
    })
      .attr("class","circos_connection")
      .style("stroke-width",1)
      .style("stroke",function(d){return color(d.chrom1);})
      .style("fill","none")
      .attr("d",circos_connection_path_generator)
      
}

////////////////  Draw the top zoom plot  ////////////////////

var draw_top_zoom = function() {

      top_chrom_coverage_data = []
      for (var i=0;i<coverage.length;i++){
        if (coverage[i].chromosome == top_zoom_chromosome) {
          top_chrom_coverage_data.push(coverage[i])
        }
      }

      if (top_chrom_coverage_data.length == 0) {
        console.log(top_zoom_chromosome)
        throw "No coverage for any chromosome with that name"
      }

      top_zoom_container.selectAll("*").remove()
      top_zoom_canvas = top_zoom_container.append("g");

      var zoom_top_position_start = d3.min(top_chrom_coverage_data,function(d){return d.start});

      var zoom_top_position_end = d3.max(top_chrom_coverage_data,function(d){return d.start});
      

  //////////////// Bin data to at most one bin per pixel ////////////////////////////
      
      var x_bin_size_domain = top_chrom_coverage_data[0].end-top_chrom_coverage_data[0].start;

      var genomic_bins_per_pixel = Math.ceil((zoom_top_position_end-zoom_top_position_start)/x_bin_size_domain/both_zoom_canvas_width);
      console.log("genomic_bins_per_pixel:")
      console.log(genomic_bins_per_pixel)

      // file_bins/display_bins = (file_bins/pixels)*(pixels/display_bins)
      genomic_bins_per_zoom_top_bin = genomic_bins_per_pixel*pixels_per_bin;

      var new_coverage = []
      if (segment_copy_number==true) {
        for (var i=0;i<top_chrom_coverage_data.length-genomic_bins_per_zoom_top_bin;i=i+genomic_bins_per_zoom_top_bin) {
          new_coverage.push({"start":top_chrom_coverage_data[i].start,"end":top_chrom_coverage_data[i+genomic_bins_per_zoom_top_bin].end,"coverage":d3.mean(top_chrom_coverage_data.slice(i,i+genomic_bins_per_zoom_top_bin),function(d){return d.coverage})})
        }
      } else {
        for (var i=0;i<top_chrom_coverage_data.length-genomic_bins_per_zoom_top_bin;i=i+genomic_bins_per_zoom_top_bin) {
          new_coverage.push({"start":top_chrom_coverage_data[i].start,"end":top_chrom_coverage_data[i+genomic_bins_per_zoom_top_bin].end,"coverage":d3.mean(top_chrom_coverage_data.slice(i,i+genomic_bins_per_zoom_top_bin),function(d){return d.unsegmented_coverage})})
        }
      }
      

      /////////////////////// Set scales //////////////////////////////////

      top_zoom_x_scale
        .domain([zoom_top_position_start,zoom_top_position_end])
        .range([0,both_zoom_canvas_width])
      

      var cov_array = []
      new_coverage.forEach(function (d,i) {
          cov_array.push(d.coverage) //*fraction_y_scale_height
      });

      // console.log(cov_array.sort(function(a, b){return a-b}).reverse()[5]*fraction_y_scale_height)

      // console.log(cov_array)
      // console.log(chauvenet(cov_array))

      top_zoom_y_scale
        // .domain(d3.extent(new_coverage,function(d){return d.coverage*fraction_y_scale_height}))
        .domain([0,cov_array.sort(function(a, b){return a-b}).reverse()[2]*fraction_y_scale_height])
        // .domain(d3.extent(chauvenet(cov_array)))
        .range([both_zoom_canvas_height,0])
        .clamp(true)

      // console.log(d3.extent(new_coverage,function(d){return d.coverage}))
      // console.log(d3.extent(cov_array))

      ///////////////// Plot axes and labels ////////////////////////////////

      var top_zoom_x_axis = d3.svg.axis().scale(top_zoom_x_scale).orient("top").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
      var top_zoom_x_axis_label = top_zoom_container.append("g")
        .attr("class","axis")
        .attr("transform","translate(" + 0 + "," + 0 + ")")
        .call(top_zoom_x_axis)

      var top_zoom_y_axis = d3.svg.axis().scale(top_zoom_y_scale).orient("left").ticks(8).tickSize(5,0,1)
      var top_zoom_y_axis_label = top_zoom_container.append("g")
        .attr("class","axis")
        // .attr("transform","translate(" + 0 + "," + both_zoom_canvas_height + ")")
        .call(top_zoom_y_axis)


      top_zoom_x_axis_label.append("text")
          .text("Chromosome " + top_zoom_chromosome)
          .style('text-anchor',"middle")
          .attr("transform","translate("+ both_zoom_canvas_width/2 + "," + -30 + ")")

      /////////////////  Zoom  /////////////////

      top_update_coverage(genomic_bins_per_zoom_top_bin)
      

      var zoom_handler = function() {
          top_zoom_x_axis_label.call(top_zoom_x_axis)
          zoom_scale_factor = d3.event.scale;
          // When replotting it uses the scales, which have just been automatically updated already, so there is no need to translate/scale the plot too
          top_bins_per_bar = Math.ceil(genomic_bins_per_zoom_top_bin/zoom_scale_factor);
          top_update_coverage(top_bins_per_bar)
      };

      var zoom_scale_factor = 1;
      var zoom = d3.behavior.zoom()
        .x(top_zoom_x_scale)
        // .y(top_zoom_y_scale)
        .scaleExtent([1,genomic_bins_per_pixel*max_zoom])
        .duration(100)
        .on("zoom",
            zoom_handler
        )

      top_zoom_canvas.call(zoom);
      // top_zoom_canvas.on("dblclick.zoom",null);

      // top_zoom_canvas.on("click", function(){console.log("click");zoom(top_zoom_canvas)});

}

////////////////  Draw the bottom zoom plot  ////////////////////

var draw_bottom_zoom = function() {

      bottom_chrom_coverage_data = []
      for (var i=0;i<coverage.length;i++){
        if (coverage[i].chromosome == bottom_zoom_chromosome) {
          bottom_chrom_coverage_data.push(coverage[i])
        }
      }

      if (bottom_chrom_coverage_data.length == 0) {
        console.log(bottom_zoom_chromosome)
        throw "No coverage for any chromosome with that name"
      }


      bottom_zoom_container.selectAll("*").remove()
      bottom_zoom_canvas = bottom_zoom_container.append("g");


      var zoom_bottom_position_start = d3.min(bottom_chrom_coverage_data,function(d){return d.start});

      var zoom_bottom_position_end = d3.max(bottom_chrom_coverage_data,function(d){return d.start});
      

  //////////////// Bin data to at most one bin per pixel ////////////////////////////
      
      var x_bin_size_domain = bottom_chrom_coverage_data[0].end-bottom_chrom_coverage_data[0].start;

      var genomic_bins_per_pixel = Math.ceil((zoom_bottom_position_end-zoom_bottom_position_start)/x_bin_size_domain/both_zoom_canvas_width);

      

      var genomic_bins_per_zoom_bottom_bin = genomic_bins_per_pixel*pixels_per_bin;

      var new_coverage = []
      if (segment_copy_number==true) {
        for (var i=0;i<bottom_chrom_coverage_data.length-genomic_bins_per_zoom_bottom_bin;i=i+genomic_bins_per_zoom_bottom_bin) {
          new_coverage.push({"start":bottom_chrom_coverage_data[i].start,"end":bottom_chrom_coverage_data[i+genomic_bins_per_zoom_bottom_bin].end,"coverage":d3.mean(bottom_chrom_coverage_data.slice(i,i+genomic_bins_per_zoom_bottom_bin),function(d){return d.coverage})})
        }
      } else {
        for (var i=0;i<bottom_chrom_coverage_data.length-genomic_bins_per_zoom_bottom_bin;i=i+genomic_bins_per_zoom_bottom_bin) {
          new_coverage.push({"start":bottom_chrom_coverage_data[i].start,"end":bottom_chrom_coverage_data[i+genomic_bins_per_zoom_bottom_bin].end,"coverage":d3.mean(bottom_chrom_coverage_data.slice(i,i+genomic_bins_per_zoom_bottom_bin),function(d){return d.unsegmented_coverage})})
        }
      }
      
/////////////////////// Set scales //////////////////////////////////

      bottom_zoom_x_scale
        .domain([zoom_bottom_position_start,zoom_bottom_position_end])
        .range([0,both_zoom_canvas_width])
      
      var cov_array = []
      new_coverage.forEach(function (d,i) {
          cov_array.push(d.coverage) //*fraction_y_scale_height
      });

      bottom_zoom_y_scale
        // .domain(d3.extent(new_coverage,function(d){return d.coverage*fraction_y_scale_height}))
        .domain([0,cov_array.sort(function(a, b){return a-b}).reverse()[2]*fraction_y_scale_height])
        .range([0,both_zoom_canvas_height])
        .clamp(true)


///////////////// Plot axes and labels ////////////////////////////////

      var bottom_zoom_x_axis = d3.svg.axis().scale(bottom_zoom_x_scale).orient("bottom").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
      var bottom_zoom_x_axis_label = bottom_zoom_container.append("g")
        .attr("class","axis")
        .attr("transform","translate(" + 0 + "," + both_zoom_canvas_height + ")")
        .call(bottom_zoom_x_axis)

      var bottom_zoom_y_axis = d3.svg.axis().scale(bottom_zoom_y_scale).orient("left").ticks(8).tickSize(5,0,1)
      var bottom_zoom_y_axis_label = bottom_zoom_container.append("g")
        .attr("class","axis")
        // .attr("transform","translate(" + 0 + "," + both_zoom_canvas_height + ")")
        .call(bottom_zoom_y_axis)


      bottom_zoom_x_axis_label.append("text")
          .text("Chromosome " + bottom_zoom_chromosome)
          .style('text-anchor',"middle")
          .attr("transform","translate("+ both_zoom_canvas_width/2 + "," + 40 + ")")


      ////// Draw canvas for bottom zoom plot /////////////////
      bottom_update_coverage(genomic_bins_per_zoom_bottom_bin)


      var zoom_scale_factor = 1;
      var zoom = d3.behavior.zoom()
        .x(bottom_zoom_x_scale)
        // .y(bottom_zoom_y_scale)
        .scaleExtent([1,genomic_bins_per_pixel*max_zoom])
        .on("zoom",
            function() {
                bottom_zoom_x_axis_label.call(bottom_zoom_x_axis)
                zoom_scale_factor = d3.event.scale;
                // When replotting it uses the scales, which have just been automatically updated already, so there is no need to translate/scale the plot too
                bottom_bins_per_bar = Math.ceil(genomic_bins_per_zoom_bottom_bin/zoom_scale_factor);
                bottom_update_coverage(bottom_bins_per_bar)
            }
        )

      bottom_zoom_canvas.call(zoom);

}

//////////// Draw or redraw the coverage (at resoluton matching the current zoom level) ///////////////

var top_update_coverage = function(genomic_bins_per_bar) {
      // console.log("updating coverage")

      // console.log("genomic_bins_per_bar:")
      // console.log(genomic_bins_per_bar)

      var new_coverage = []
      if (segment_copy_number==true) {
        for (var i=0;i<top_chrom_coverage_data.length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
          new_coverage.push({"start":top_chrom_coverage_data[i].start,"end":top_chrom_coverage_data[i+genomic_bins_per_bar-1].end,"coverage":d3.mean(top_chrom_coverage_data.slice(i,i+genomic_bins_per_bar),function(d){return d.coverage})})
        }
      } else {
        for (var i=0;i<top_chrom_coverage_data.length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
          new_coverage.push({"start":top_chrom_coverage_data[i].start,"end":top_chrom_coverage_data[i+genomic_bins_per_bar-1].end,"coverage":d3.mean(top_chrom_coverage_data.slice(i,i+genomic_bins_per_bar),function(d){return d.unsegmented_coverage})})
        }
      }

      top_zoom_canvas.append("rect")
          .attr("width",both_zoom_canvas_width)
          .attr("height",both_zoom_canvas_height)
          .attr("class","top_zoom_canvas")

      var coverage_rects = top_zoom_canvas.selectAll("coverage_rect")
        .data(new_coverage).enter()
        .append("rect")
        .filter(function(d){return top_zoom_x_scale(d.start) > 0 && top_zoom_x_scale(d.end) < both_zoom_canvas_width})
        .attr("class","coverage_rect")
        .attr("x",function(d){return top_zoom_x_scale(d.start)})
        .attr("y",function(d){return top_zoom_y_scale(d.coverage)})
        .attr("width",function(d){return Math.ceil(top_zoom_x_scale(d.end)-top_zoom_x_scale(d.start))})
        .attr("height",function(d){return both_zoom_canvas_height-top_zoom_y_scale(d.coverage)})
        .style("fill",function(d){return color(top_zoom_chromosome)})
        .style("stroke",function(d){return color(top_zoom_chromosome)})




      draw_connections();
      draw_splitthreader_boxes_top();
      draw_genes_top();
      
}


//////////// Draw or redraw the coverage (at resoluton matching the current zoom level) ///////////////

var bottom_update_coverage = function(genomic_bins_per_bar) {
      // console.log("updating coverage")
      var new_coverage = []
      if (segment_copy_number==true) {
        for (var i=0;i<bottom_chrom_coverage_data.length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
          new_coverage.push({"start":bottom_chrom_coverage_data[i].start,"end":bottom_chrom_coverage_data[i+genomic_bins_per_bar-1].end,"coverage":d3.mean(bottom_chrom_coverage_data.slice(i,i+genomic_bins_per_bar),function(d){return d.coverage})})
        }
      } else {
        for (var i=0;i<bottom_chrom_coverage_data.length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
          new_coverage.push({"start":bottom_chrom_coverage_data[i].start,"end":bottom_chrom_coverage_data[i+genomic_bins_per_bar-1].end,"coverage":d3.mean(bottom_chrom_coverage_data.slice(i,i+genomic_bins_per_bar),function(d){return d.unsegmented_coverage})})
        }
      }

      bottom_zoom_canvas.append("rect")
          .attr("width",both_zoom_canvas_width)
          .attr("height",both_zoom_canvas_height)
          .attr("class","bottom_zoom_canvas")

      var coverage_rects = bottom_zoom_canvas.selectAll("coverage_rect")
        .data(new_coverage).enter()
        .append("rect")
        .filter(function(d){return bottom_zoom_x_scale(d.start) > 0 && bottom_zoom_x_scale(d.end) < both_zoom_canvas_width})
        .attr("class","coverage_rect")
        .attr("x",function(d){return bottom_zoom_x_scale(d.start)})
        .attr("y", 0)
        .attr("width",function(d){return bottom_zoom_x_scale(d.end)-bottom_zoom_x_scale(d.start)})
        .attr("height",function(d){return bottom_zoom_y_scale(d.coverage)})
        .style("fill",function(d){return color(bottom_zoom_chromosome)})
        .style("stroke",function(d){return color(bottom_zoom_chromosome)})


      draw_connections();
      draw_splitthreader_boxes_bottom();
      draw_genes_bottom();

}


////////////   Selects and uses the correct scale for x positions according to the lengths of the chromosomes, choosing between top and bottom plots ////////

var scale_position_by_chromosome  = function(chromosome, position, top_or_bottom) {
  
  if (top_or_bottom == "top" && top_zoom_chromosome == chromosome){
    return top_zoom_x_scale(position)
  } else if (top_or_bottom == "bottom" && bottom_zoom_chromosome == chromosome) {
    return bottom_zoom_x_scale(position)
  } else {
    return null;
  }
}

var scale_coverage_by_chromosome = function(top_or_bottom,coverage) {

  if (top_or_bottom == "top"){
    return (-1*(both_zoom_canvas_height-top_zoom_y_scale(coverage)))
  } else if (top_or_bottom == "bottom") {
    return bottom_zoom_y_scale(coverage)
  } else {
    return null;
  }
}


var foot_spacing_from_axis = 5;
var foot_length = 15;

var gene_offset = 40;



function reverse_chrom1_and_chrom2(d) {
  var reversed = {};
  for (var property in d){
    reversed[property] = d[property];
  }
  // Flip chromosomes around
  var tmp = reversed.chrom1;
  reversed.chrom1=reversed.chrom2;
  reversed.chrom2 = tmp;
  // Flip positions around
  tmp = reversed.pos1;
  reversed.pos1=reversed.pos2;
  reversed.pos2=tmp;
  // Flip strands around
  var tmp = reversed.strand1;
  reversed.strand1=reversed.strand2;
  reversed.strand2=tmp;
  // Flip span counts around
  var tmp = reversed.span1;
  reversed.span1=reversed.span2;
  reversed.span2=tmp;
  return reversed;

}

function top_plus_bottom_minus(chromosome) {
  return (Number(chromosome == top_zoom_chromosome)*2-1)
}

/////////   Draw connections between top and bottom zoom plots   /////////////

var draw_connections = function() {

    var y_coordinate_for_connection = d3.scale.ordinal()
      .domain(["top","bottom"])
      .range([both_zoom_canvas_height+top_edge_padding+foot_spacing_from_axis,bottom_zoom_canvas_top_y_coordinate-foot_spacing_from_axis])

    var y_coordinate_for_zoom_plot_base = d3.scale.ordinal()
      .domain(["top","bottom"])
      .range([both_zoom_canvas_height+top_edge_padding,bottom_zoom_canvas_top_y_coordinate])


    //////////   Classify connections so we can plot them differently   ///////////

    var top_chrom_to_bottom_chrom = []
    var within_top_chrom = []
    var within_bottom_chrom = []
    var top_chrom_to_other = []
    var bottom_chrom_to_other = []

    for (var i = 0;i < connection_data.length; i++) {
      var d = connection_data[i];

      var within_view_1_top = false;
      var within_view_2_top = false;
      var within_view_1_bottom = false;
      var within_view_2_bottom = false;

      var variant_size = Math.abs(d.pos2-d.pos1);
      if (d.split > config["min_split_reads"] && (variant_size > config["min_variant_size"] || d.chrom1 != d.chrom2)) {

        var scaled_position_1_top = scale_position_by_chromosome(d.chrom1,d.pos1,"top");
        var scaled_position_1_bottom = scale_position_by_chromosome(d.chrom1,d.pos1,"bottom");

        var scaled_position_2_top = scale_position_by_chromosome(d.chrom2,d.pos2,"top");
        var scaled_position_2_bottom = scale_position_by_chromosome(d.chrom2,d.pos2,"bottom");

        if (scaled_position_1_top > 0 && scaled_position_1_top < both_zoom_canvas_width)  {
          within_view_1_top = true;
        }
        if (scaled_position_1_bottom > 0 && scaled_position_1_bottom < both_zoom_canvas_width){
          within_view_1_bottom = true;
        }
        if (scaled_position_2_top > 0 && scaled_position_2_top < both_zoom_canvas_width) {
          within_view_2_top = true;
        }
        if (scaled_position_2_bottom > 0 && scaled_position_2_bottom < both_zoom_canvas_width) {
          within_view_2_bottom = true;
        }


        //  1. Both within view looping on top chromosome
        //  2. Both within view looping on bottom chromosome
        //  3. Both within view as connection
        //  4. Both within view as reverse connection
        //  5. Others


        if ( (d.chrom1 == top_zoom_chromosome && d.chrom2 == top_zoom_chromosome) && (within_view_1_top && within_view_2_top) ){
          within_top_chrom.push(d)
        } else if ( (d.chrom1 == top_zoom_chromosome && d.chrom2 == bottom_zoom_chromosome) && (within_view_1_top && within_view_2_bottom) ){
          top_chrom_to_bottom_chrom.push(d) // save as a connection
        } else if ( (d.chrom1 == bottom_zoom_chromosome && d.chrom2 == top_zoom_chromosome) && (within_view_1_bottom && within_view_2_top) ){
          top_chrom_to_bottom_chrom.push(reverse_chrom1_and_chrom2(d)) // save as a connection
        } else if ( (d.chrom1 == bottom_zoom_chromosome && d.chrom2 == bottom_zoom_chromosome) && (within_view_1_bottom && within_view_2_bottom)) {
          within_bottom_chrom.push(d)
        } else {
          // Within top chromosome  
          if (d.chrom1 == top_zoom_chromosome && d.chrom2 == top_zoom_chromosome) {
            if (within_view_1_top && within_view_2_top) { ///////////////
                within_top_chrom.push(d) /////////////////////
              } else if (within_view_1_top) {
                top_chrom_to_other.push(d) // save 1 as top stub
              } else if (within_view_2_top) {
                top_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
              } // else: don't save it anywhere since it won't be shown even as a stub 
          // Between the top and bottom plots
          } else if (d.chrom1 == top_zoom_chromosome && d.chrom2 == bottom_zoom_chromosome) {
              if (within_view_1_top && within_view_2_bottom) { ///////////////////
                top_chrom_to_bottom_chrom.push(d) // save as a connection ///////////////
              } else if (within_view_1_top) {
                top_chrom_to_other.push(d) // save 1 as top stub
              } else if (within_view_2_bottom) {
                bottom_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
              } // else: don't save it anywhere since it won't be shown even as a stub 
          // Within bottom chromosome
          } else if (d.chrom1 == bottom_zoom_chromosome && d.chrom2 == bottom_zoom_chromosome) {
            if (within_view_1_bottom && within_view_2_bottom) { //////////////////
                within_bottom_chrom.push(d) //////////////////
              } else if (within_view_1_bottom) {
                bottom_chrom_to_other.push(d) // save 1 as top stub
              } else if (within_view_2_bottom) {
                bottom_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
              } // else: don't save it anywhere since it won't be shown even as a stub 
          
          } else if (d.chrom1 == bottom_zoom_chromosome && d.chrom2 == top_zoom_chromosome) {
              if (within_view_1_bottom && within_view_2_top) { ///////////////////
                top_chrom_to_bottom_chrom.push(reverse_chrom1_and_chrom2(d)) // save as a connection ////////////////////
              } else if (within_view_2_top) { // 2 is top this time
                top_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as top stub 
              } else if (within_view_1_bottom) { // 1 is bottom this time
                bottom_chrom_to_other.push(d) // save as bottom stub, 1 is already bottom, so no need to flip
              } // else: don't save it anywhere since it won't be shown even as a stub 
          // Top chromosome to another chromosome
          } else if (d.chrom1 == top_zoom_chromosome) {
            top_chrom_to_other.push(d)
            // console.log("top to other")
            // console.log(d)
          } else if (d.chrom2 == top_zoom_chromosome) {
            top_chrom_to_other.push(reverse_chrom1_and_chrom2(d))
            // console.log("top to other reversed")
            // console.log(reverse_chrom1_and_chrom2(d))
          // Bottom chromosome to another chromosome
          } else if (d.chrom1 == bottom_zoom_chromosome) {
            bottom_chrom_to_other.push(d)
            // console.log("bottom to other")
            // console.log(d)
          } else if (d.chrom2 == bottom_zoom_chromosome) {
            bottom_chrom_to_other.push(reverse_chrom1_and_chrom2(d))
            // console.log("bottom to other reversed")
            // console.log(reverse_chrom1_and_chrom2(d))
          }
        }
      } // end check for config["min_variant_size"] and config["min_split_reads"]
    }



    // Line path generator for connections with feet on both sides to indicate strands
    var connection_path_generator = function(d) {
        var x1 = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top"),  // top
            y1 = y_coordinate_for_connection("top"),
            x2 = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"bottom"),  // bottom
            y2 = y_coordinate_for_connection("bottom")
            direction1 = Number(d.strand1=="-")*2-1, // negative strands means the read is mappping to the right of the breakpoint
            direction2 = Number(d.strand2=="-")*2-1;

        return (
             "M " + (x1+foot_length*direction1) + "," + y1
         + ", L " + x1                          + "," + y1 
         + ", L " + x2                          + "," + y2
         + ", L " + (x2+foot_length*direction2) + "," + y2)
    }

    var stub_path_generator = function(d,top_or_bottom) {

        var x1 = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,top_or_bottom),
            y1 = y_coordinate_for_connection(top_or_bottom);

        var x2 = x1,
            y2 = y1 + stub_height*(Number(top_or_bottom=="top")*2-1)
            direction1 = Number(d.strand1=="-")*2-1; // negative strands means the read is mappping to the right of the breakpoint
            
        return (
             "M " + (x1+foot_length*direction1) + "," + y1
         + ", L " + x1                          + "," + y1 
         + ", L " + x2                          + "," + y2)
    }

    var loop_path_generator = function(d,top_or_bottom) {

        var x1 = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,top_or_bottom),
            y1 = y_coordinate_for_connection(top_or_bottom),

            x2 = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,top_or_bottom),
            y2 = y_coordinate_for_connection(top_or_bottom);

        var xmid = (x1+x2)/2;
        var ymid = y1;
        if (top_or_bottom == "top") {
          ymid = y1 + top_loop_scale(Math.abs(d.pos1-d.pos2))
        } else {
          ymid = y1 - bottom_loop_scale(Math.abs(d.pos1-d.pos2))
        }
            // ymid = y1 + loop_scale(Math.abs(d.pos1-d.pos2))*(Number(top_or_bottom=="top")*2-1),

        var direction1 = Number(d.strand1=="-")*2-1, // negative strands means the read is mappping to the right of the breakpoint
            direction2 = Number(d.strand2=="-")*2-1;

        return (
             "M " + (x1+foot_length*direction1) + "," + y1
         + ", L " + x1                          + "," + y1 
         + ", S " + xmid                        + "," + ymid + "," + x2                          + "," + y2
         // + ", L " + x2                          + "," + y2
         + ", L " + (x2+foot_length*direction2) + "," + y2)
    }


    //////////////////   Draw direct connections between these two chromosomes   /////////////////////////

    // Clear previous lines
    svg.selectAll("path.spansplit_connection").remove()
    svg.selectAll("path.spansplit_stub_top").remove()
    svg.selectAll("path.spansplit_stub_bottom").remove()
    svg.selectAll("path.spansplit_loop_top").remove()
    svg.selectAll("path.spansplit_loop_bottom").remove()

    // Draw new lines for connections
    svg.selectAll("path.spansplit_connection")
      .data(top_chrom_to_bottom_chrom)
      .enter()
      // .append("line")
      .append("path")
        .filter(function(d){ 
          if (scale_position_by_chromosome(d.chrom1,d.pos1,"top") > 0 && scale_position_by_chromosome(d.chrom1,d.pos1,"top") < both_zoom_canvas_width && scale_position_by_chromosome(d.chrom2,d.pos2,"bottom") > 0 && scale_position_by_chromosome(d.chrom2,d.pos2,"bottom") < both_zoom_canvas_width) {
            return true;
          } else {
            return false;
          }
        })
        .attr("class","spansplit_connection")
        .style("stroke-width",thickness_of_connections)
        .style("stroke",color_connections)
        .attr("fill","none")
        .attr("d",connection_path_generator)
        .on('mouseover',variant_tip.show)
        .on('mouseout',variant_tip.hide)


        

    // var max_top_distance = 0;
    // var max_bottom_distance = 0;



    // within_top_chrom.forEach(function(d,i){max_top_distance = d3.max([max_top_distance,Math.abs(d.pos1-d.pos2)])})
    // within_bottom_chrom.forEach(function(d,i){max_top_distance = d3.max([max_top_distance,Math.abs(d.pos1-d.pos2)])})

    top_loop_scale.domain([0,d3.extent(within_top_chrom,function(d){return Math.abs(d.pos1-d.pos2)})[1]])
    bottom_loop_scale.domain([0,d3.extent(within_bottom_chrom,function(d){return Math.abs(d.pos1-d.pos2)})[1]])

    // Draw loops within each chromosome 
    svg.selectAll("path.spansplit_loop_top")
      .data(within_top_chrom)
      .enter()
      .append("path")
        .filter(function(d){  // check that both positions are within view
          if ((top_zoom_x_scale(d.pos1) > 0 && top_zoom_x_scale(d.pos1) < both_zoom_canvas_width) && (top_zoom_x_scale(d.pos2) > 0 && top_zoom_x_scale(d.pos2) < both_zoom_canvas_width)) {
            return true;
          } else {
            return false;
          }
        })
        .attr("class","spansplit_loop_top")
        .style("stroke-width",thickness_of_connections)
        .style("stroke",color_connections)
        .attr("fill","none")
        .attr("d",function(d){return loop_path_generator(d,"top")})
        .on('mouseover',variant_tip.show)
        .on('mouseout',variant_tip.hide)


    svg.selectAll("path.spansplit_loop_bottom")
      .data(within_bottom_chrom)
      .enter()
      .append("path")
        .filter(function(d){  // check that both positions are within view
          if ((bottom_zoom_x_scale(d.pos1) > 0 && bottom_zoom_x_scale(d.pos1) < both_zoom_canvas_width) && (bottom_zoom_x_scale(d.pos2) > 0 && bottom_zoom_x_scale(d.pos2) < both_zoom_canvas_width)) {
            return true;
          } else {
            return false;
          }
        })
        .attr("class","spansplit_loop_top")
        .style("stroke-width",thickness_of_connections)
        .style("stroke",color_connections)
        .attr("fill","none")
        .attr("d",function(d){return loop_path_generator(d,"bottom")})
        .on('mouseover',variant_tip.show)
        .on('mouseout',variant_tip.hide)



    // Mark other connections as feet and short stubby lines straight up
    svg.selectAll("path.spansplit_stub_top")
      .data(top_chrom_to_other)
      .enter()
      .append("path")
        .filter(function(d){ 
          if (top_zoom_x_scale(d.pos1) > 0 && top_zoom_x_scale(d.pos1) < both_zoom_canvas_width) {
            return true;
          } else {
            return false;
          }
        })
        .attr("class","spansplit_stub_top")
        .style("stroke-width",thickness_of_connections)
        .style("stroke",color_connections)
        .attr("fill","none")
        .attr("d",function(d){return stub_path_generator(d,"top")})
        .on('mouseover',variant_tip.show)
        .on('mouseout',variant_tip.hide)


    svg.selectAll("path.spansplit_stub_bottom")
      .data(bottom_chrom_to_other)
      .enter()
      .append("path")
        .filter(function(d){ 
          if (bottom_zoom_x_scale(d.pos1) > 0 && bottom_zoom_x_scale(d.pos1) < both_zoom_canvas_width) {
            return true;
          } else {
            return false;
          }
        })
        .attr("class","spansplit_stub_bottom")
        .style("stroke-width",thickness_of_connections)
        .style("stroke",color_connections)
        .attr("fill","none")
        .attr("d",function(d){ return stub_path_generator(d,"bottom")})
        .on('mouseover',variant_tip.show)
        .on('mouseout',variant_tip.hide)


    ///////////////  Spansplit count lines  /////////////////

    // Span:
    svg.selectAll("line.span_count_line_1_top").remove()
    svg.selectAll("line.span_count_line_1_bottom").remove()
    svg.selectAll("line.span_count_line_2_bottom").remove()
    svg.selectAll("line.span_count_line_2_top").remove()
    // Split:
    svg.selectAll("line.split_count_line_1_top").remove()
    svg.selectAll("line.split_count_line_1_bottom").remove()
    svg.selectAll("line.split_count_line_2_top").remove()
    svg.selectAll("line.split_count_line_2_bottom").remove()
    
    if (plot_spansplit_counts == true) {

          //  Span lines
          svg.selectAll("line.span_count_line_1_top")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom1,d.pos1,"top") > 0 && scale_position_by_chromosome(d.chrom1,d.pos1,"top") < both_zoom_canvas_width) {
                  // console.log("1:top");
                  // console.log(d.span1);
                  // console.log(scale_coverage_by_chromosome("top",d.span1));
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","span_count_line_1_top")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top"); return (x_coord - spansplit_bar_length/2); })
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top"); return (x_coord + spansplit_bar_length/2); })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span1)); })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span1)); })


          svg.selectAll("line.span_count_line_1_bottom")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom1,d.pos1,"bottom") > 0 && scale_position_by_chromosome(d.chrom1,d.pos1,"bottom") < both_zoom_canvas_width) {
                  // console.log("1:bottom");
                  // console.log(d.span1);
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","span_count_line_1_bottom")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom"); return (x_coord - spansplit_bar_length/2); })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span1)); })
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom"); return (x_coord + spansplit_bar_length/2); })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span1)); })

          svg.selectAll("line.span_count_line_2_bottom")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom2,d.pos2,"bottom") > 0 && scale_position_by_chromosome(d.chrom2,d.pos2,"bottom") < both_zoom_canvas_width) {
                  // console.log("2:bottom");
                  // console.log(d.span2);
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","span_count_line_2_bottom")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"bottom"); return (x_coord - spansplit_bar_length/2); })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span2)); })
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"bottom"); return (x_coord + spansplit_bar_length/2); })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span2)); })

          svg.selectAll("line.span_count_line_2_top")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom2,d.pos2,"top") > 0 && scale_position_by_chromosome(d.chrom2,d.pos2,"top") < both_zoom_canvas_width) {
                  // console.log("2:top");
                  // console.log(d.span2);
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","span_count_line_2_top")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"top"); return (x_coord - spansplit_bar_length/2); })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span2)); })
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"top"); return (x_coord + spansplit_bar_length/2); })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span2)); })



          //  Split lines:
    
          svg.selectAll("line.split_count_line_1_top")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom1,d.pos1,"top") > 0 && scale_position_by_chromosome(d.chrom1,d.pos1,"top") < both_zoom_canvas_width) {
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","split_count_line_1_top")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top"); return x_coord; })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span1)); }) // bottom is same as span line
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top"); return x_coord; })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span1+d.split)); }) // top is span line plus split 

          svg.selectAll("line.split_count_line_1_bottom")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom1,d.pos1,"bottom") > 0 && scale_position_by_chromosome(d.chrom1,d.pos1,"bottom") < both_zoom_canvas_width) {
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","split_count_line_1_bottom")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom"); return x_coord; })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span1)); }) // bottom is same as span line
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom"); return x_coord; })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span1+d.split)); }) // top is span line plus split 


          svg.selectAll("line.split_count_line_2_top")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom2,d.pos2,"top") > 0 && scale_position_by_chromosome(d.chrom2,d.pos2,"top") < both_zoom_canvas_width) {
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","split_count_line_2_top")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"top"); return x_coord; })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span2)); }) // bottom is same as span line
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"top"); return x_coord; })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("top")+scale_coverage_by_chromosome("top",d.span2+d.split)); }) // top is span line plus split 

          svg.selectAll("line.split_count_line_2_bottom")
            .data(connection_data)
            .enter()
            .append("line")
              .filter(function(d){ 
                if (scale_position_by_chromosome(d.chrom2,d.pos2,"bottom") > 0 && scale_position_by_chromosome(d.chrom2,d.pos2,"bottom") < both_zoom_canvas_width) {
                  return true;
                } else {
                  return false;
                }
              })
              .attr("class","split_count_line_2_bottom")
              .style("stroke-width",2)
              .style("stroke", "black")
              .attr("fill","none")
              .attr("x1",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"bottom"); return x_coord; })
              .attr("y1",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span2)); }) // bottom is same as span line
              .attr("x2",function(d){ var x_coord = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom2,d.pos2,"bottom"); return x_coord; })
              .attr("y2",function(d){ return (y_coordinate_for_zoom_plot_base("bottom")+scale_coverage_by_chromosome("bottom",d.span2+d.split)); }) // top is span line plus split 



    } // end if plot spansplit counts
    
}


var draw_splitthreader_boxes_top = function() {

  top_zoom_canvas.selectAll("rect.splitthreader_box").remove()
  
  if (show_boxes) {
      var splitthreader_boxes_top = top_zoom_canvas.selectAll("splitthreader_box")
          .data(boxes_data).enter()
          .append("rect")
          .filter(function(d){return d.chromosome == top_zoom_chromosome && (
              (top_zoom_x_scale(d.start) > 0 && top_zoom_x_scale(d.start) < both_zoom_canvas_width) || 
              (top_zoom_x_scale(d.end) > 0 && top_zoom_x_scale(d.end) < both_zoom_canvas_width)
            )
          }) 
          .attr("class","splitthreader_box")
          .attr("x",function(d){return Math.max(0, top_zoom_x_scale(d.start))})
          .attr("y",function(d){return top_zoom_y_scale(d.y_start+d.height)})
          .attr("width",function(d){return Math.min(top_zoom_x_scale(d.end),both_zoom_canvas_width) - Math.max(0, top_zoom_x_scale(d.start))})
          .attr("height",function(d){return both_zoom_canvas_height-top_zoom_y_scale(d.height)})
          .style("fill",function(d){return box_colors(d.path_ID)})
          .on('mouseover', box_tip.show)
          .on('mouseout', box_tip.hide)
          .on('click',function(d) {highlight_variants(d.variant_names)})
          // .style("stroke","black")
  }
  
}



var draw_splitthreader_boxes_bottom = function() {

  bottom_zoom_canvas.selectAll("rect.splitthreader_box").remove()

  if (show_boxes) {
      var splitthreader_boxes_bottom = bottom_zoom_canvas.selectAll("splitthreader_box")
          .data(boxes_data).enter()
          .append("rect")
          .filter(function(d){
            return  d.chromosome == bottom_zoom_chromosome && (
              (bottom_zoom_x_scale(d.start) > 0 && bottom_zoom_x_scale(d.start) < both_zoom_canvas_width) || 
              (bottom_zoom_x_scale(d.end) > 0 && bottom_zoom_x_scale(d.end) < both_zoom_canvas_width)
            )
          })
          .attr("class","splitthreader_box")
          .attr("x",function(d){return Math.max(0,bottom_zoom_x_scale(d.start))})
          .attr("y",function(d){return bottom_zoom_y_scale(d.y_start)})
          .attr("width",function(d){return Math.min(bottom_zoom_x_scale(d.end),both_zoom_canvas_width) - Math.max(0,bottom_zoom_x_scale(d.start))})
          .attr("height",function(d){return bottom_zoom_y_scale(d.height)})
          .style("fill",function(d){return box_colors(d.path_ID)})
          .on('mouseover', box_tip.show)
          .on('mouseout', box_tip.hide)
          .on('click',function(d) {highlight_variants(d.variant_names)})
          // .style("stroke","black")
  }

}


var arrow_path_generator = function(d, top_or_bottom) {
    // console.log("arrow path generator")

    var arrowhead_size = 5;
    var arrow_head = d.start;
    var arrow_butt = d.end;
    if (d.strand == "+") {
      console.log(d.gene)
      console.log("forward")
      arrow_head = d.end
      arrow_butt = d.start
      arrowhead_size = -1 * arrowhead_size;
    } else if (d.strand == "-"){

      console.log(d.gene)
      console.log("reverse")
    }



    var x1 = top_zoom_x_scale(arrow_butt),  // start (arrow butt)
        x2 = top_zoom_x_scale(arrow_head),  // end (arrow head)
        y = gene_offset;
        

    if (top_or_bottom == "bottom") {
      x1 = bottom_zoom_x_scale(arrow_butt);  // start (arrow butt)
      x2 = bottom_zoom_x_scale(arrow_head);  // end (arrow head)
      y = both_zoom_canvas_height-gene_offset;
    }

    return (
         "M " + x1                          + "," + y
     + ", L " + x2                          + "," + y 
     + ", L " + (x2 + arrowhead_size)         + "," + (y + arrowhead_size)
     + ", L " + x2                          + "," + y 
     + ", L " + (x2 + arrowhead_size)         + "," + (y - arrowhead_size))

}


var draw_genes_top = function() {
  top_zoom_canvas.selectAll("text.top_gene_label").remove()
  top_zoom_canvas.selectAll("path.top_gene_arrow").remove()

  var genes_top = top_zoom_canvas.selectAll("text.top_gene_label")
    .data(relevant_annotation).enter()
    .append("text")
      .filter(function(d){return d.chromosome == top_zoom_chromosome && top_zoom_x_scale(d.start) > 0 && top_zoom_x_scale(d.end) < both_zoom_canvas_width})
      // .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
      .text(function(d){return d.gene})
      .attr("x",function(d){return top_zoom_x_scale((d.start+d.end)/2)})
      .attr("y",(gene_offset/2))
      .attr("class","top_gene_label")
      .style('text-anchor',"middle")
      .attr("dominant-baseline","middle")
      // .on("click",function(d) {highlight_oncogene_with_boxes(d.gene)})


    var gene_arrows_top = top_zoom_canvas.selectAll("path.top_gene_arrow")
    .data(relevant_annotation).enter()
    .append("path")
      .filter(function(d){return d.chromosome == top_zoom_chromosome && top_zoom_x_scale(d.start) > 0 && top_zoom_x_scale(d.end) < both_zoom_canvas_width})
      // .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
      .attr("class","top_gene_arrow")
      .attr("d",function(d) {return arrow_path_generator(d,top_or_bottom="top")})
      .style("stroke-width",2)
      .style("stroke","black")
      .style("fill","none")
}

var draw_genes_bottom = function() {
  bottom_zoom_canvas.selectAll("text.bottom_gene_label").remove()
  bottom_zoom_canvas.selectAll("path.bottom_gene_arrow").remove()

  var genes_bottom = bottom_zoom_canvas.selectAll("text.bottom_gene_label")
    .data(relevant_annotation).enter()
    .append("text")
      .filter(function(d){return d.chromosome == bottom_zoom_chromosome && bottom_zoom_x_scale(d.start) > 0 && bottom_zoom_x_scale(d.end) < both_zoom_canvas_width})
      // .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
      .text(function(d){return d.gene})
      .attr("x",function(d){return bottom_zoom_x_scale((d.start+d.end)/2)})
      .attr("y",(both_zoom_canvas_height-gene_offset/2))
      .attr("class","bottom_gene_label")
      .style('text-anchor',"middle")
      .attr("dominant-baseline","middle")
      // .on("click",function(d) {highlight_oncogene_with_boxes(d.gene)})

  var gene_arrows_bottom = bottom_zoom_canvas.selectAll("path.bottom_gene_arrow")
    .data(relevant_annotation).enter()
    .append("path")
      .filter(function(d){return d.chromosome == bottom_zoom_chromosome && bottom_zoom_x_scale(d.start) > 0 && bottom_zoom_x_scale(d.end) < both_zoom_canvas_width})
      // .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
      .attr("class","bottom_gene_arrow")
      .attr("d",function(d) {return arrow_path_generator(d,top_or_bottom="bottom")})
      .style("stroke-width",2)
      .style("stroke","black")
      .style("fill","none")

}


var select_chrom_for_zoom_top = function(d) {
  top_zoom_chromosome = d;
  draw_top_zoom();
}

var select_chrom_for_zoom_bottom = function(d) {
  bottom_zoom_chromosome = d;
  draw_bottom_zoom();
}

var update_genes = function() {

  draw_genes_top();
  draw_genes_bottom();

}

var change_genes_shown = function(gene_list) {
  genes_to_show = gene_list
  relevant_annotation = []
  annotation_data.forEach(function (d,i) {
    if (genes_to_show.indexOf(d.gene) != -1) {
      relevant_annotation.push(d)
    }     
  });

}

var show_gene_fusion_dropdown = function() {
    var gene_fusion_dropdown = d3.select("#gene_fusion_dropdown_menu").html("");

    gene_fusion_dropdown
      .selectAll("li")
      .data(gene_fusion_data)
      .enter()
      .append("li")
      .append("a")
        .text(function(d){return (d.gene1 + " - " + d.gene2)})
        .on("click",highlight_gene_fusion)

}

function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

var highlight_variants = function(delimited_variant_string) {
  
  //  Toggle off
  if (arraysEqual(variants_to_highlight, delimited_variant_string.split("|"))) {
    variants_to_highlight = []

  } else { // Toggle on
    variants_to_highlight = delimited_variant_string.split("|")
  }
  draw_connections();
}

var zoom_distance_around_gene = 5000000;

var highlight_gene_fusion = function(d) {

  if (top_zoom_chromosome != d.chrom1) {
    select_chrom_for_zoom_top(d.chrom1);
  } else {
    console.log(get_annotation_by_gene_name(d.gene1).start)
    console.log(top_zoom_x_scale(get_annotation_by_gene_name(d.gene1).start))
    var coordinate = top_zoom_x_scale(get_annotation_by_gene_name(d.gene1).start);
    if (coordinate < 0 || coordinate > both_zoom_canvas_width) {
      select_chrom_for_zoom_top(d.chrom1);
    }
  }

  if (bottom_zoom_chromosome != d.chrom2) {
    select_chrom_for_zoom_bottom(d.chrom2);  
  } else {
    var coordinate = bottom_zoom_x_scale(get_annotation_by_gene_name(d.gene2).start);
    if (coordinate < 0 || coordinate > both_zoom_canvas_width) {
      select_chrom_for_zoom_bottom(d.chrom2);
    }
  }

  message_to_user("Highlighting gene fusion: " + d.gene1 + " - " + d.gene2)
  
  change_genes_shown([d.gene1,d.gene2]);

  update_genes();

  variants_to_highlight = d.variant_names.split("|");
  draw_connections();

  // gene_fusion_to_highlight = d;

}

var get_annotation_by_gene_name = function(gene) {
  var annotation_index = annotation_genes_available.indexOf(gene);
  if (annotation_index != -1){
    return annotation_data[annotation_index]
  } else {
    return null;
  }
}

var color_connections = function(d) {

    if (variants_to_highlight.indexOf(d.variant_name)!=-1) {
        return color_for_highlighted_connections;
    } else {
        return color(d.chrom2); 
    }
}

var thickness_of_connections = function(d) {

    if (variants_to_highlight.indexOf(d.variant_name)!=-1) {
        return 4;
    } else {
        return 2;
    }
}

var wait_then_draw_boxes = function() {
  if (boxes_done == true) {
    draw_splitthreader_boxes_top();
    draw_splitthreader_boxes_bottom();
  } else {
    window.setTimeout(wait_then_draw_boxes,300)  
  }
}



//////////    Settings    ////////////////

var toggle_boxes = function() {
  if (show_boxes) {
    toggle_boxes_off()
  } else {
    toggle_boxes_on()
  }
}

var show_evolution_boxes = function() {
  read_splitthreader_boxes_file();
  wait_then_draw_boxes();  
}

var toggle_boxes_on = function() {
  show_boxes = true;
  d3.select("#toggle_boxes")
    .text("Hide boxes from SplitThreader Evolution")
  // highlight_oncogene_with_boxes(region_to_show_boxes_for)
  show_evolution_boxes()
}

var toggle_boxes_off = function() {
  show_boxes = false;
  d3.select("#toggle_boxes")
    .text("Show boxes from SplitThreader Evolution")
  remove_boxes()
}

var remove_boxes = function() {
  top_zoom_canvas.selectAll("rect.splitthreader_box").remove()
  bottom_zoom_canvas.selectAll("rect.splitthreader_box").remove()
}


function toggle_spansplit_lines() {
  if (plot_spansplit_counts == false) {
    plot_spansplit_counts = true;
    draw_connections();
    d3.select("#toggle_spansplit_lines")
      .text("Hide span/split count lines")
  } else {
    plot_spansplit_counts = false;
    draw_connections();
    d3.select("#toggle_spansplit_lines")
      .text("Show span/split count lines")
  }
}


function toggle_segment_copy_number() {
  if (segment_copy_number == false) {
    segment_copy_number = true;
    //  REDRAW copy number:
    console.log(top_bins_per_bar)
    top_update_coverage(top_bins_per_bar);
    bottom_update_coverage(bottom_bins_per_bar);
    // Change text on menu:
    d3.select("#toggle_segment_copy_number")
      .text("Show raw read coverage")
  } else {
    segment_copy_number = false;
    //  REDRAW copy number:
    console.log(top_bins_per_bar)
    top_update_coverage(top_bins_per_bar);
    bottom_update_coverage(bottom_bins_per_bar);
    // Change text on menu:
    d3.select("#toggle_segment_copy_number")
      .text("Show segmented read coverage")
  }
}



//////////    Printing messages to user in bottom left corner    ////////////////

function message_to_user(message) {
  console.log(message)
  panel_canvas.selectAll("text").remove()

  var formatted_nickname = nickname.replace(/_/g ," "); // replace underscores with spaces in nickname

  // var parameters_to_print = "";
  // Object.keys(config).forEach(function(key,index) {
  //   parameters_to_print += key + ": " + config[key] + ', ';
  // })
  
  var whole_message = message; //+ "\n" + parameters_to_print;

  
  panel_canvas.append("text")
    .attr("class","sample_title")
    .text(formatted_nickname)
    .attr('y',0)
    .attr('dy',1)
    // .call(wrap,panel_width)

  panel_canvas.append("text")
    .attr("class","user_message")
    .text(whole_message)
    .attr('y',90)
    .attr("dy",1);

  panel_canvas.selectAll("text")
    .call(wrap,panel_width);

    // panel_canvas.append("text")
    // .attr("class","user_message")
    // .attr("y",50)
    // .text(parameters_to_print);
}



//  Taken from https://bl.ocks.org/mbostock/7555321
//  Used for message_to_user()
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

function user_set_min_variant_size() {
  console.log("user_set_min_variant_size")

  config["min_variant_size"] = prompt("set minimum variant size:",config["min_variant_size"])

  d3.select("#user_set_min_variant_size")
      .text("Minimum variant size = " + config["min_variant_size"])

  draw_connections();
  draw_circos_connections();

}

function user_set_min_split_reads() {
  console.log("user_set_min_split_reads")

  config["min_split_reads"] = prompt("set minimum number of split reads per variant: ",config["min_split_reads"])

  d3.select("#user_set_min_split_reads")
      .text("Minimum split reads = " + config["min_split_reads"])

  draw_connections();
  draw_circos_connections();

}

//////////    Populate navbar with visualizer settings    ////////////////

function populate_navbar() {

  // Separating bar
  
  // Settings
  settings_link = d3.select("#navbar")
    .append("li")
      .attr("class","dropdown")

  settings_link
      .append("a")
        .html("Settings <span class='caret'></span>")
        .attr("class","dropdown-toggle")
        .attr("data-toggle","dropdown")
        .attr("href","")
    
  settings = settings_link.append("ul")
      .attr("class","dropdown-menu")
      .attr("id", "settings_dropdown_menu")
      .attr("role","menu")

  settings.append("li").append("a")
    .attr("href",void(0))
    .attr("id","toggle_boxes")
    .on("click",toggle_boxes)
    .text("Hide boxes from SplitThreader Evolution")


  settings.append("li").append("a")
    .attr("href",void(0))
    .attr("id","user_set_min_variant_size")
    .on("click",user_set_min_variant_size)
    .text("Minimum variant size = " + config["min_variant_size"])


  settings.append("li").append("a")
    .attr("href",void(0))
    .attr("id","user_set_min_split_reads")
    .on("click",user_set_min_split_reads)
    .text("Minimum split reads = " + config["min_split_reads"])




// config["min_split_reads"]





  // settings.append("li").append("a")
  //   .attr("href",void(0))
  //   .attr("id","toggle_spansplit_lines")
  //   .on("click",toggle_spansplit_lines)
  //   .text("Show span/split count lines")

  // settings.append("li").append("a")
  //   .attr("href",void(0))
  //   .attr("id","toggle_segment_copy_number")
  //   .on("click",toggle_segment_copy_number)
  //   .text("Show segmented read coverage")


  // Add also variant numreads and min_size filters (maybe a dialog box that user can type a number into)





  // settings.html('<li><a href="javascript:void(0)" onclick="toggle_boxes()" id="toggle_boxes">Hide boxes from SplitThreader Evolution</a></li>
  //             <li><a href="javascript:void(0)" onclick="toggle_spansplit_lines()" id="toggle_spansplit_lines">Show span/split count lines</a></li>
  //             <li><a href="javascript:void(0)" onclick="toggle_segment_copy_number()" id="toggle_segment_copy_number">Show segmented read coverage</a></li></ul>')



}



// ===========================================================================
// == Responsiveness
// ===========================================================================

// 
// Resize SVG and sidebar when window size changes
window.onresize = resizeWindow;
function resizeWindow()
{
  responsive_sizing();
  draw_everything();
  message_to_user("");
}



run()