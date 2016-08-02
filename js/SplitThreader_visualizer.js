
function getUrlVars() {
		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				vars[key] = value;
		});
		return vars;
}

var _config_path="user_uploads/" + getUrlVars()["code"] + ".config";
var _input_file_prefix = "user_data/" + getUrlVars()["code"] + "/" + getUrlVars()["nickname"];


var _layout = {"svg_width":null, "svg_height": null, "circos_size": null, "radius": null};

var _padding = {};
var _settings = {};
_settings.show_gene_types = {};
_settings.show_variant_types = {};
_settings.show_local_gene_names = false;


var _scales = {};
_scales.zoom_plots= {"top":{"x":d3.scale.linear(), "y":d3.scale.linear()}, "bottom":{"x":d3.scale.linear(), "y":d3.scale.linear()}};


var _zoom_containers = {"top":null,"bottom":null};

var svg;

var both_zoom_canvas_height;
var both_zoom_left_x_coordinate;
var both_zoom_canvas_width;


var circos_canvas;
var chrom_label_size;



var bottom_zoom_canvas_top_y_coordinate; 

var fusion_genes = {};

var _SplitThreader_graph = new Graph();

////////////////////////////////////            DRAWING              ///////////////////////////////////////////

function responsive_sizing() {

	var panel_width_fraction = 0.25;
	var top_banner_size = 65;

	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0];


	var window_width = (w.innerWidth || e.clientWidth || g.clientWidth);
	_layout.svg_width = window_width*(1-panel_width_fraction);
	_layout.svg_height = (w.innerHeight || e.clientHeight || g.clientHeight)*0.96 - top_banner_size;

	d3.select("#right_panel")
		.style("display","block")
		.style("width",window_width*panel_width_fraction*0.90 + "px")
		.style("height",_layout.svg_height + "px")
		.style("float","left");



	_padding.top = _layout.svg_height*0.10;
	_padding.bottom = _layout.svg_height*0.10; 
	_padding.left = _layout.svg_width*0.02; 
	_padding.right = _layout.svg_width*0.02; 
	_padding.tooltip = _layout.svg_height*0.05;
	_padding.between_circos_and_zoom_plots = _layout.svg_width*0.02; 

	_layout.circos_size = _layout.svg_width*0.35; //Math.min(_layout.svg_width,_layout.svg_height)*0.50;

	_layout.radius = _layout.circos_size / 2 - _padding.left;

	////////  Clear the svg to start drawing from scratch  ////////
	
	d3.selectAll("svg").remove()

	////////  Create the SVG  ////////
	svg = d3.select("#svg_landing")
		.append("svg:svg")
		.attr("width", _layout.svg_width)
		.attr("height", _layout.svg_height)

	both_zoom_canvas_height = (_layout.svg_height-_padding.top-_padding.bottom)/3;
	both_zoom_left_x_coordinate = _layout.circos_size + _padding.between_circos_and_zoom_plots;
	both_zoom_canvas_width = _layout.svg_width-both_zoom_left_x_coordinate-_padding.right;



	////////  Top zoom plot  ////////

	_zoom_containers["top"] = svg.append("g")
		// .attr("class","_zoom_containers["top"]")
		.attr("transform","translate(" + both_zoom_left_x_coordinate + "," + _padding.top + ")")

	////////  Bottom zoom plot  ////////

	bottom_zoom_canvas_top_y_coordinate = _layout.svg_height-_padding.bottom-both_zoom_canvas_height;

	_zoom_containers["bottom"] = svg.append("g")
		// .attr("class","_zoom_containers["bottom"]")
		.attr("transform","translate(" + both_zoom_left_x_coordinate + "," + bottom_zoom_canvas_top_y_coordinate + ")")


	////////  Set up circos canvas  ////////
	circos_canvas = svg.append("svg:g")
		// .attr("class","circos_canvas")
		.attr("transform", "translate(" + (_layout.radius+_padding.left) + "," + (_layout.radius+_padding.top) + ")")

	chrom_label_size = _layout.radius/5;


}

responsive_sizing();




////////////////////////////////////            DATA              ///////////////////////////////////////////

var chromosomes = []; //["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","X","Y"];
var chromosome_colors = ["#ffff00","#ad0000","#bdadc6", "#00ffff", "#e75200","#de1052","#ffa5a5","#7b7b00","#7bffff","#008c00","#00adff","#ff00ff","#ff0000","#ff527b","#84d6a5","#e76b52","#8400ff","#6b4242","#52ff52","#0029ff","#ffffad","#ff94ff","#004200","gray","black"];
// var chromosome_colors = ['#E41A1C', '#A73C52', '#6B5F88', '#3780B3', '#3F918C', '#47A266','#53A651', '#6D8470', '#87638F', '#A5548D', '#C96555', '#ED761C','#FF9508', '#FFC11A', '#FFEE2C', '#EBDA30', '#CC9F2C', '#AD6428','#BB614F', '#D77083', '#F37FB8', '#DA88B3', '#B990A6', '#999999']


// Custom color scale to match karyotype
var color = d3.scale.ordinal()
		.domain(chromosomes) // input domain
		.range(chromosome_colors); // output range


var genome_size_total = 0;

var pixels_per_bin = 1; 

var segment_copy_number = false;


var chromosome_start_positions = []
var chromosome_position_scale = d3.scale.ordinal()
	.domain(chromosomes)
	.range(chromosome_start_positions)


var genome_data = [];
var coverage = null;

var coverage_by_chromosome = {};

var connection_data = null;
var annotation_data = null;
var gene_fusion_data = null;
var annotation_by_chrom = {};


var genes_to_show = [];
var relevant_annotation = []; // has to be a list for d3 display
var annotation_by_gene = {}; // only contains genes we have searched for


var chosen_chromosomes = {"top":null, "bottom":null};

// var chosen_chromosomes["bottom"] = null;

//////////   Set up zoom top canvas and scales //////////

_zoom_containers["top"].on("mouseover",function(){
	hover_plot = "top";
});

// var zoom_plot_canvas["top"] = null;

var zoom_plot_canvas = {"top": null, "bottom": null};

var fraction_y_scale_height = 1.4;





var genomic_bins_per_zoom_top_bin = null;
var top_bins_per_bar = 5;



//////////   Set up zoom bottom canvas and scales //////////


_zoom_containers["bottom"].on("mouseover",function(){
	hover_plot = "bottom";
})




var genomic_bins_per_zoom_bottom_bin = null;
var bottom_bins_per_bar = 5;


////////// Set up dragging behavior for chromosome selection //////////////

var dragging_chromosome = null; // Which chromosome are you dragging from the circos plot?
var hover_plot = null; // Which plot (top or bottom) are you about to drop the chromosome onto?

var coverage_done = false;

var _data_ready = {"coverage": {"top": false, "bottom": false}, "spansplit": false};


/////////  Gene fusions  /////////////

// var gene_fusion_to_highlight = null;
var variants_to_highlight = [];
var color_for_highlighted_connections = "black";


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
	.range([loop_height,bottom_zoom_canvas_top_y_coordinate-both_zoom_canvas_height-_padding.top])
	.clamp(true)

var bottom_loop_scale = d3.scale.linear()
	.domain([1000000,100000000])
	.range([loop_height,bottom_zoom_canvas_top_y_coordinate-both_zoom_canvas_height-_padding.top])
	.clamp(true)

///////////   Add tooltips   /////////////////

var _tooltip = {};
function show_tooltip(text,x,y,parent_object) {
	parent_object.selectAll("g.tip").remove();
	_tooltip.g = parent_object.append("g").attr("class","tip");
	_tooltip.g.attr("transform","translate(" + x + "," + y +  ")").style("visibility","visible");
	
	_tooltip.width = (text.length + 4) * (_layout.svg_width/100);
	_tooltip.height = (_layout.svg_height/20);

	_tooltip.rect = _tooltip.g.append("rect")
			.attr("width",_tooltip.width)
			.attr("x",(-_tooltip.width/2))
			.attr("height",_tooltip.height)
			.attr("y",(-_tooltip.height/2))
			.attr("fill","black");

	_tooltip.tip = _tooltip.g.append("text");
	_tooltip.tip.text(text).attr("fill","white").style('text-anchor',"middle").attr("dominant-baseline","middle");
}


///////////  Run the whole program by loading all files and when they are loaded drawing everything ///////////

var run = function(){
	populate_navbar();

	read_annotation_file(); // when not using config and in case config file doesn't work or has no input

	read_config_file();
	
	
	read_genome_file();
	// read_coverage_file();

	read_spansplit_file();
	
	
	// read_fusion_report_file(); //////////////////////////    TESTING SplitThreader.js library   ////////////////////////////////
	// show_oncogene_dropdown();
	user_message("Info","Loading data");
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
	// console.log("checking")
	if (_data_ready.coverage["top"] & _data_ready.coverage["bottom"] & _data_ready.spansplit) {
		// console.log("ready")
		draw_everything(); 
		//////////////////////////    Using the SplitThreader.js library   ////////////////////////////////
		// for SplitThreader.js graph the variants should be: {"variant_name":"variant1","chrom1":"1","pos1":50100,"strand1":"-","chrom2":"2","pos2":1000,"strand2":"-"},
		_SplitThreader_graph.from_genomic_variants(connection_data,genome_data);
		//////////////////////////    Using the SplitThreader.js library   ////////////////////////////////

		user_message("Info","Loading data is complete")
	} else {
		console.log("waiting for data to load")
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
config["annotation"] = "resources/annotation/Human_hg19.genes.csv";


var read_config_file = function() {
	d3.csv(_config_path, function(error,config_input) {
		if (error) throw error;
		// console.log("CONFIG FILE:");
		for (var i=0;i<config_input.length;i++){
			// console.log(config_input[i]);
			if (isNaN(config_input[i].val)) {
				config[config_input[i].parameter] = config_input[i].val; // string doesn't contain a number
			} else {
				config[config_input[i].parameter] = +config_input[i].val; // string does contain a number
			}
		}
		// console.log(config);
		read_annotation_file();
	});
}



var read_genome_file = function() {
		d3.csv(_input_file_prefix + ".genome.csv", function(error,genome_input) {
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

		if (genome_data.length == 0) {
			user_message("Error","No genome file");
		}
		else {
			chosen_chromosomes["top"] = genome_data[0].chromosome;
			load_coverage(genome_data[0].chromosome,top_or_bottom="top")
			if (genome_data.length > 1) {
				chosen_chromosomes["bottom"] = genome_data[1].chromosome;
				load_coverage(genome_data[1].chromosome,top_or_bottom="bottom")
			} else {
				chosen_chromosomes["bottom"] = genome_data[0].chromosome;
				load_coverage(genome_data[0].chromosome,top_or_bottom="bottom")
			}
		}
		
	});
}

///////////////////   Load coverage  ////////////////////////////////

var load_coverage = function(chromosome,top_or_bottom) {

	// console.log("loading chromosome coverage from file");
	d3.csv(_input_file_prefix + ".copynumber.segmented." + chromosome + ".csv?id=" + Math.random(), function(error,coverage_input) {
			if (error) throw error;

			coverage_by_chromosome[chromosome] = [];
			for (var i=0;i<coverage_input.length;i++) {
				// Make columns numerical:
				coverage_by_chromosome[chromosome].push({});
				coverage_by_chromosome[chromosome][i].start = +coverage_input[i].start
				coverage_by_chromosome[chromosome][i].end = +coverage_input[i].end
				coverage_by_chromosome[chromosome][i].unsegmented_coverage = +coverage_input[i].coverage
				coverage_by_chromosome[chromosome][i].coverage = +coverage_input[i].segmented_coverage
			}
			if (top_or_bottom == "top") {
				// console.log("Coverage for TOP finished loading");
				_data_ready.coverage["top"] = true;

			} else {
				// console.log("Coverage for BOTTOM finished loading")
				_data_ready.coverage["bottom"] = true;
			}
	});
}

var read_spansplit_file = function() {
	d3.csv(_input_file_prefix + ".variants.csv?id=" + Math.random(), function(error,spansplit_input) {
		// chrom1,start1,stop1,chrom2,start2,stop2,variant_name,score,strand1,strand2,variant_type,split
		if (error) throw error;

		for (var i=0;i<spansplit_input.length;i++) {
			spansplit_input[i].start1 = +spansplit_input[i].start1 
			spansplit_input[i].start2 = +spansplit_input[i].start2
			spansplit_input[i].stop1 = +spansplit_input[i].stop1 
			spansplit_input[i].stop2 = +spansplit_input[i].stop2
			spansplit_input[i].pos1 = (spansplit_input[i].start1+spansplit_input[i].stop1)/2
			spansplit_input[i].pos2 = (spansplit_input[i].start2+spansplit_input[i].stop2)/2
			spansplit_input[i].split = +spansplit_input[i].split
			// spansplit_input[i].span1 = +spansplit_input[i].span1
			// spansplit_input[i].span2 = +spansplit_input[i].span2
		}
		connection_data = spansplit_input;

		_data_ready.spansplit = true;
		make_variant_table();
	});
}

var read_annotation_file = function() {
	console.log("looking for annotaiton file");
	if (config["annotation"] != "none") {
		console.log("Reading annotation");

		d3.csv(config["annotation"], function(error,annotation_input) {

			if (error) throw error;

			// annotation_genes_available = []
			annotation_by_chrom = {};
			for (var i=0;i<annotation_input.length;i++) {
				annotation_input[i].start = +annotation_input[i].start;
				annotation_input[i].end = +annotation_input[i].end;
				if (annotation_by_chrom[annotation_input[i].chromosome] == undefined) {
					annotation_by_chrom[annotation_input[i].chromosome] = [];
				}
				annotation_by_chrom[annotation_input[i].chromosome].push(annotation_input[i]);
				// annotation_genes_available.push(annotation_input[i].gene)
			}
			annotation_data = annotation_input;
			create_gene_search_boxes();
			make_gene_type_table();
			console.log("Finished reading annotation")
			// console.log(annotation_data[0])
		});
	} else {
		console.log("No annotation chosen");
	}
}

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
					// console.log("Switch top to " + dragging_chromosome)
				}
				else if (hover_plot == "bottom") {
					select_chrom_for_zoom_bottom(dragging_chromosome);
					// console.log("Switch bottom to " + dragging_chromosome)
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

		var arc = d3.svg.arc()
				.outerRadius(_layout.radius)
				.innerRadius(_layout.radius-chrom_label_size)
				.startAngle(function(d){return genome_to_angle(d.chromosome,0)})
				.endAngle(function(d){return genome_to_angle(d.chromosome,d.size)})


		chromosome_labels.append("path")
				.attr("fill", function(d) { return color(d.chromosome); } ) //set the color for each slice to be chosen from the color function defined above
				.attr("d", arc)
				// .call(drag)

		chromosome_labels.append("text")
			.attr("transform",function(d) {
				d.innerRadius = 0
				d.outerRadius = _layout.radius;
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
	var connection_point_radius = _layout.radius - chrom_label_size;

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

			_zoom_containers["top"].selectAll("*").remove()
			zoom_plot_canvas["top"] = _zoom_containers["top"].append("g");

			var zoom_top_position_start = d3.min(coverage_by_chromosome[chosen_chromosomes["top"]],function(d){return d.start});

			var zoom_top_position_end = d3.max(coverage_by_chromosome[chosen_chromosomes["top"]],function(d){return d.start});
			

	//////////////// Bin data to at most one bin per pixel ////////////////////////////
			
			var x_bin_size_domain = coverage_by_chromosome[chosen_chromosomes["top"]][0].end-coverage_by_chromosome[chosen_chromosomes["top"]][0].start;

			var genomic_bins_per_pixel = Math.ceil((zoom_top_position_end-zoom_top_position_start)/x_bin_size_domain/both_zoom_canvas_width);
			// console.log("genomic_bins_per_pixel:")
			// console.log(genomic_bins_per_pixel)

			// file_bins/display_bins = (file_bins/pixels)*(pixels/display_bins)
			genomic_bins_per_zoom_top_bin = genomic_bins_per_pixel*pixels_per_bin;

			var new_coverage = []
			if (segment_copy_number==true) {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["top"]].length-genomic_bins_per_zoom_top_bin;i=i+genomic_bins_per_zoom_top_bin) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["top"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["top"]][i+genomic_bins_per_zoom_top_bin].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["top"]].slice(i,i+genomic_bins_per_zoom_top_bin),function(d){return d.coverage})})
				}
			} else {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["top"]].length-genomic_bins_per_zoom_top_bin;i=i+genomic_bins_per_zoom_top_bin) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["top"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["top"]][i+genomic_bins_per_zoom_top_bin].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["top"]].slice(i,i+genomic_bins_per_zoom_top_bin),function(d){return d.unsegmented_coverage})})
				}
			}
			

			/////////////////////// Set scales //////////////////////////////////

			_scales.zoom_plots["top"].x
				.domain([zoom_top_position_start,zoom_top_position_end])
				.range([0,both_zoom_canvas_width])
			

			var cov_array = []
			new_coverage.forEach(function (d,i) {
					cov_array.push(d.coverage) //*fraction_y_scale_height
			});

			// console.log(cov_array.sort(function(a, b){return a-b}).reverse()[5]*fraction_y_scale_height)

			// console.log(cov_array)
			// console.log(chauvenet(cov_array))

			_scales.zoom_plots["top"].y
				// .domain(d3.extent(new_coverage,function(d){return d.coverage*fraction_y_scale_height}))
				.domain([0,cov_array.sort(function(a, b){return a-b}).reverse()[2]*fraction_y_scale_height])
				// .domain(d3.extent(chauvenet(cov_array)))
				.range([both_zoom_canvas_height,0])
				.clamp(true)

			// console.log(d3.extent(new_coverage,function(d){return d.coverage}))
			// console.log(d3.extent(cov_array))

			///////////////// Plot axes and labels ////////////////////////////////

			var top_zoom_x_axis = d3.svg.axis().scale(_scales.zoom_plots["top"].x).orient("top").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
			var top_zoom_x_axis_label = _zoom_containers["top"].append("g")
				.attr("class","axis")
				.attr("transform","translate(" + 0 + "," + 0 + ")")
				.call(top_zoom_x_axis)

			var top_zoom_y_axis = d3.svg.axis().scale(_scales.zoom_plots["top"].y).orient("left").ticks(8).tickSize(5,0,1)
			var top_zoom_y_axis_label = _zoom_containers["top"].append("g")
				.attr("class","axis")
				// .attr("transform","translate(" + 0 + "," + both_zoom_canvas_height + ")")
				.call(top_zoom_y_axis)


			top_zoom_x_axis_label.append("text")
					.text("Chromosome " + chosen_chromosomes["top"])
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
				.x(_scales.zoom_plots["top"].x)
				// .y(_scales.zoom_plots["top"].y)
				.scaleExtent([1,genomic_bins_per_pixel*max_zoom])
				.duration(100)
				.on("zoom",
						zoom_handler
				)

			zoom_plot_canvas["top"].call(zoom);
			// zoom_plot_canvas["top"].on("dblclick.zoom",null);

			// zoom_plot_canvas["top"].on("click", function(){console.log("click");zoom(zoom_plot_canvas["top"])});

}

////////////////  Draw the bottom zoom plot  ////////////////////

var draw_bottom_zoom = function() {

			_zoom_containers["bottom"].selectAll("*").remove()
			zoom_plot_canvas["bottom"] = _zoom_containers["bottom"].append("g");


			var zoom_bottom_position_start = d3.min(coverage_by_chromosome[chosen_chromosomes["bottom"]],function(d){return d.start});

			var zoom_bottom_position_end = d3.max(coverage_by_chromosome[chosen_chromosomes["bottom"]],function(d){return d.start});
			

	//////////////// Bin data to at most one bin per pixel ////////////////////////////
			
			var x_bin_size_domain = coverage_by_chromosome[chosen_chromosomes["bottom"]][0].end-coverage_by_chromosome[chosen_chromosomes["bottom"]][0].start;

			var genomic_bins_per_pixel = Math.ceil((zoom_bottom_position_end-zoom_bottom_position_start)/x_bin_size_domain/both_zoom_canvas_width);

			

			var genomic_bins_per_zoom_bottom_bin = genomic_bins_per_pixel*pixels_per_bin;

			var new_coverage = []
			if (segment_copy_number==true) {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["bottom"]].length-genomic_bins_per_zoom_bottom_bin;i=i+genomic_bins_per_zoom_bottom_bin) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["bottom"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["bottom"]][i+genomic_bins_per_zoom_bottom_bin].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["bottom"]].slice(i,i+genomic_bins_per_zoom_bottom_bin),function(d){return d.coverage})})
				}
			} else {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["bottom"]].length-genomic_bins_per_zoom_bottom_bin;i=i+genomic_bins_per_zoom_bottom_bin) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["bottom"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["bottom"]][i+genomic_bins_per_zoom_bottom_bin].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["bottom"]].slice(i,i+genomic_bins_per_zoom_bottom_bin),function(d){return d.unsegmented_coverage})})
				}
			}
			
/////////////////////// Set scales //////////////////////////////////

			_scales.zoom_plots["bottom"].x
				.domain([zoom_bottom_position_start,zoom_bottom_position_end])
				.range([0,both_zoom_canvas_width])
			
			var cov_array = []
			new_coverage.forEach(function (d,i) {
					cov_array.push(d.coverage) //*fraction_y_scale_height
			});

			_scales.zoom_plots["bottom"].y
				// .domain(d3.extent(new_coverage,function(d){return d.coverage*fraction_y_scale_height}))
				.domain([0,cov_array.sort(function(a, b){return a-b}).reverse()[2]*fraction_y_scale_height])
				.range([0,both_zoom_canvas_height])
				.clamp(true)


///////////////// Plot axes and labels ////////////////////////////////

			var bottom_zoom_x_axis = d3.svg.axis().scale(_scales.zoom_plots["bottom"].x).orient("bottom").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
			var bottom_zoom_x_axis_label = _zoom_containers["bottom"].append("g")
				.attr("class","axis")
				.attr("transform","translate(" + 0 + "," + both_zoom_canvas_height + ")")
				.call(bottom_zoom_x_axis)

			var bottom_zoom_y_axis = d3.svg.axis().scale(_scales.zoom_plots["bottom"].y).orient("left").ticks(8).tickSize(5,0,1)
			var bottom_zoom_y_axis_label = _zoom_containers["bottom"].append("g")
				.attr("class","axis")
				// .attr("transform","translate(" + 0 + "," + both_zoom_canvas_height + ")")
				.call(bottom_zoom_y_axis)


			bottom_zoom_x_axis_label.append("text")
					.text("Chromosome " + chosen_chromosomes["bottom"])
					.style('text-anchor',"middle")
					.attr("transform","translate("+ both_zoom_canvas_width/2 + "," + 40 + ")")


			////// Draw canvas for bottom zoom plot /////////////////
			bottom_update_coverage(genomic_bins_per_zoom_bottom_bin)

			var zoom_scale_factor = 1;
			var zoom = d3.behavior.zoom()
				.x(_scales.zoom_plots["bottom"].x)
				// .y(_scales.zoom_plots["bottom"].y)
				.scaleExtent([1,genomic_bins_per_pixel*max_zoom])
				.on("zoom",
						function() {
								// console.log("zoom")
								bottom_zoom_x_axis_label.call(bottom_zoom_x_axis)
								zoom_scale_factor = d3.event.scale;
								// When replotting it uses the scales, which have just been automatically updated already, so there is no need to translate/scale the plot too
								bottom_bins_per_bar = Math.ceil(genomic_bins_per_zoom_bottom_bin/zoom_scale_factor);
								bottom_update_coverage(bottom_bins_per_bar);
						}
				)

			zoom_plot_canvas["bottom"].call(zoom);
}


//////////// Draw or redraw the coverage (at resoluton matching the current zoom level) ///////////////

var top_update_coverage = function(genomic_bins_per_bar) {
			// console.log("updating coverage")

			// console.log("genomic_bins_per_bar:")
			// console.log(genomic_bins_per_bar)

			var new_coverage = []
			if (segment_copy_number==true) {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["top"]].length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["top"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["top"]][i+genomic_bins_per_bar-1].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["top"]].slice(i,i+genomic_bins_per_bar),function(d){return d.coverage})})
				}
			} else {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["top"]].length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["top"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["top"]][i+genomic_bins_per_bar-1].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["top"]].slice(i,i+genomic_bins_per_bar),function(d){return d.unsegmented_coverage})})
				}
			}

			zoom_plot_canvas["top"].append("rect")
					.attr("width",both_zoom_canvas_width)
					.attr("height",both_zoom_canvas_height)
					.attr("class","top_zoom_canvas")

			var coverage_rects = zoom_plot_canvas["top"].selectAll("coverage_rect")
				.data(new_coverage).enter()
				.append("rect")
				.filter(function(d){return _scales.zoom_plots["top"].x(d.start) > 0 && _scales.zoom_plots["top"].x(d.end) < both_zoom_canvas_width})
				.attr("class","coverage_rect")
				.attr("x",function(d){return _scales.zoom_plots["top"].x(d.start)})
				.attr("y",function(d){return _scales.zoom_plots["top"].y(d.coverage)})
				.attr("width",function(d){return Math.ceil(_scales.zoom_plots["top"].x(d.end)-_scales.zoom_plots["top"].x(d.start))})
				.attr("height",function(d){return both_zoom_canvas_height-_scales.zoom_plots["top"].y(d.coverage)})
				.style("fill",function(d){return color(chosen_chromosomes["top"])})
				.style("stroke",function(d){return color(chosen_chromosomes["top"])})


			draw_connections();
			draw_genes_top();
			
}


//////////// Draw or redraw the coverage (at resoluton matching the current zoom level) ///////////////

var bottom_update_coverage = function(genomic_bins_per_bar) {

			var new_coverage = []
			if (segment_copy_number==true) {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["bottom"]].length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["bottom"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["bottom"]][i+genomic_bins_per_bar-1].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["bottom"]].slice(i,i+genomic_bins_per_bar),function(d){return d.coverage})})
				}
			} else {
				for (var i=0;i<coverage_by_chromosome[chosen_chromosomes["bottom"]].length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
					new_coverage.push({"start":coverage_by_chromosome[chosen_chromosomes["bottom"]][i].start,"end":coverage_by_chromosome[chosen_chromosomes["bottom"]][i+genomic_bins_per_bar-1].end,"coverage":d3.mean(coverage_by_chromosome[chosen_chromosomes["bottom"]].slice(i,i+genomic_bins_per_bar),function(d){return d.unsegmented_coverage})})
				}
			}

			zoom_plot_canvas["bottom"].append("rect")
					.attr("width",both_zoom_canvas_width)
					.attr("height",both_zoom_canvas_height)
					.attr("class","bottom_zoom_canvas")

			var coverage_rects = zoom_plot_canvas["bottom"].selectAll("coverage_rect")
				.data(new_coverage).enter()
				.append("rect")
				.filter(function(d){return _scales.zoom_plots["bottom"].x(d.start) > 0 && _scales.zoom_plots["bottom"].x(d.end) < both_zoom_canvas_width})
				.attr("class","coverage_rect")
				.attr("x",function(d){return _scales.zoom_plots["bottom"].x(d.start)})
				.attr("y", 0)
				.attr("width",function(d){return _scales.zoom_plots["bottom"].x(d.end)-_scales.zoom_plots["bottom"].x(d.start)})
				.attr("height",function(d){return _scales.zoom_plots["bottom"].y(d.coverage)})
				.style("fill",function(d){return color(chosen_chromosomes["bottom"])})
				.style("stroke",function(d){return color(chosen_chromosomes["bottom"])})


			draw_connections();
			draw_genes_bottom();

}


////////////   Selects and uses the correct scale for x positions according to the lengths of the chromosomes, choosing between top and bottom plots ////////

var scale_position_by_chromosome  = function(chromosome, position, top_or_bottom) {
	
	if (top_or_bottom == "top" && chosen_chromosomes["top"] == chromosome){
		return _scales.zoom_plots["top"].x(position)
	} else if (top_or_bottom == "bottom" && chosen_chromosomes["bottom"] == chromosome) {
		return _scales.zoom_plots["bottom"].x(position)
	} else {
		return null;
	}
}

var scale_coverage_by_chromosome = function(top_or_bottom,coverage) {

	if (top_or_bottom == "top"){
		return (-1*(both_zoom_canvas_height-_scales.zoom_plots["top"].y(coverage)))
	} else if (top_or_bottom == "bottom") {
		return _scales.zoom_plots["bottom"].y(coverage)
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
	// Flip starts and stops around (for completeness when sending data to Ribbon)
	tmp = reversed.start1;
	reversed.start1=reversed.start2;
	reversed.start2=tmp;

	tmp = reversed.stop1;
	reversed.stop1=reversed.stop2;
	reversed.stop2=tmp;

	// Flip strands around
	var tmp = reversed.strand1;
	reversed.strand1=reversed.strand2;
	reversed.strand2=tmp;
	// Flip span counts around
	// var tmp = reversed.span1;
	// reversed.span1=reversed.span2;
	// reversed.span2=tmp;
	return reversed;

}

function top_plus_bottom_minus(chromosome) {
	return (Number(chromosome == chosen_chromosomes["top"])*2-1)
}

/////////   Draw connections between top and bottom zoom plots   /////////////

var draw_connections = function() {

		var y_coordinate_for_connection = d3.scale.ordinal()
			.domain(["top","bottom"])
			.range([both_zoom_canvas_height+_padding.top+foot_spacing_from_axis,bottom_zoom_canvas_top_y_coordinate-foot_spacing_from_axis])

		var y_coordinate_for_zoom_plot_base = d3.scale.ordinal()
			.domain(["top","bottom"])
			.range([both_zoom_canvas_height+_padding.top,bottom_zoom_canvas_top_y_coordinate])


		//////////   Classify connections so we can plot them differently   ///////////

		var top_chrom_to_bottom_chrom = [];
		var within_top_chrom = [];
		var within_bottom_chrom = [];
		var top_chrom_to_other = [];
		var bottom_chrom_to_other = [];

		for (var i = 0;i < connection_data.length; i++) {
			var d = connection_data[i];
			if (_settings.show_variant_types[connection_data[i].variant_type] == false) {
				continue;
			}

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


				if ( (d.chrom1 == chosen_chromosomes["top"] && d.chrom2 == chosen_chromosomes["top"]) && (within_view_1_top && within_view_2_top) ){
					within_top_chrom.push(d)
				} else if ( (d.chrom1 == chosen_chromosomes["top"] && d.chrom2 == chosen_chromosomes["bottom"]) && (within_view_1_top && within_view_2_bottom) ){
					top_chrom_to_bottom_chrom.push(d) // save as a connection
				} else if ( (d.chrom1 == chosen_chromosomes["bottom"] && d.chrom2 == chosen_chromosomes["top"]) && (within_view_1_bottom && within_view_2_top) ){
					top_chrom_to_bottom_chrom.push(reverse_chrom1_and_chrom2(d)) // save as a connection
				} else if ( (d.chrom1 == chosen_chromosomes["bottom"] && d.chrom2 == chosen_chromosomes["bottom"]) && (within_view_1_bottom && within_view_2_bottom)) {
					within_bottom_chrom.push(d)
				} else {
					// Within top chromosome  
					if (d.chrom1 == chosen_chromosomes["top"] && d.chrom2 == chosen_chromosomes["top"]) {
						if (within_view_1_top && within_view_2_top) { ///////////////
								within_top_chrom.push(d) /////////////////////
							} else if (within_view_1_top) {
								top_chrom_to_other.push(d) // save 1 as top stub
							} else if (within_view_2_top) {
								top_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
							} // else: don't save it anywhere since it won't be shown even as a stub 
					// Between the top and bottom plots
					} else if (d.chrom1 == chosen_chromosomes["top"] && d.chrom2 == chosen_chromosomes["bottom"]) {
							if (within_view_1_top && within_view_2_bottom) { ///////////////////
								top_chrom_to_bottom_chrom.push(d) // save as a connection ///////////////
							} else if (within_view_1_top) {
								top_chrom_to_other.push(d) // save 1 as top stub
							} else if (within_view_2_bottom) {
								bottom_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
							} // else: don't save it anywhere since it won't be shown even as a stub 
					// Within bottom chromosome
					} else if (d.chrom1 == chosen_chromosomes["bottom"] && d.chrom2 == chosen_chromosomes["bottom"]) {
						if (within_view_1_bottom && within_view_2_bottom) { //////////////////
								within_bottom_chrom.push(d) //////////////////
							} else if (within_view_1_bottom) {
								bottom_chrom_to_other.push(d) // save 1 as top stub
							} else if (within_view_2_bottom) {
								bottom_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
							} // else: don't save it anywhere since it won't be shown even as a stub 
					
					} else if (d.chrom1 == chosen_chromosomes["bottom"] && d.chrom2 == chosen_chromosomes["top"]) {
							if (within_view_1_bottom && within_view_2_top) { ///////////////////
								top_chrom_to_bottom_chrom.push(reverse_chrom1_and_chrom2(d)) // save as a connection ////////////////////
							} else if (within_view_2_top) { // 2 is top this time
								top_chrom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as top stub 
							} else if (within_view_1_bottom) { // 1 is bottom this time
								bottom_chrom_to_other.push(d) // save as bottom stub, 1 is already bottom, so no need to flip
							} // else: don't save it anywhere since it won't be shown even as a stub 
					// Top chromosome to another chromosome
					} else if (d.chrom1 == chosen_chromosomes["top"]) {
						top_chrom_to_other.push(d)
						// console.log("top to other")
						// console.log(d)
					} else if (d.chrom2 == chosen_chromosomes["top"]) {
						top_chrom_to_other.push(reverse_chrom1_and_chrom2(d))
						// console.log("top to other reversed")
						// console.log(reverse_chrom1_and_chrom2(d))
					// Bottom chromosome to another chromosome
					} else if (d.chrom1 == chosen_chromosomes["bottom"]) {
						bottom_chrom_to_other.push(d)
						// console.log("bottom to other")
						// console.log(d)
					} else if (d.chrom2 == chosen_chromosomes["bottom"]) {
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
				.on('click',variant_click)
				.on('mouseover', function(d) {
					var text = d.split + " reads";
					var x = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top");
					var y = y_coordinate_for_connection("top") - _padding.tooltip;
					show_tooltip(text,x,y,svg);
				})
				.on('mouseout', function(d) {svg.selectAll("g.tip").remove();});


				

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
					if ((_scales.zoom_plots["top"].x(d.pos1) > 0 && _scales.zoom_plots["top"].x(d.pos1) < both_zoom_canvas_width) && (_scales.zoom_plots["top"].x(d.pos2) > 0 && _scales.zoom_plots["top"].x(d.pos2) < both_zoom_canvas_width)) {
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
				.on('click',variant_click)
				.on('mouseover', function(d) {
					var text = d.split + " reads";
					var x = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top");
					var y = y_coordinate_for_connection("top") - _padding.tooltip;
					show_tooltip(text,x,y,svg);
				})
				.on('mouseout', function(d) {svg.selectAll("g.tip").remove();});


		svg.selectAll("path.spansplit_loop_bottom")
			.data(within_bottom_chrom)
			.enter()
			.append("path")
				.filter(function(d){  // check that both positions are within view
					if ((_scales.zoom_plots["bottom"].x(d.pos1) > 0 && _scales.zoom_plots["bottom"].x(d.pos1) < both_zoom_canvas_width) && (_scales.zoom_plots["bottom"].x(d.pos2) > 0 && _scales.zoom_plots["bottom"].x(d.pos2) < both_zoom_canvas_width)) {
						return true;
					} else {
						return false;
					}
				})
				.attr("class","spansplit_loop_bottom")
				.style("stroke-width",thickness_of_connections)
				.style("stroke",color_connections)
				.attr("fill","none")
				.attr("d",function(d){return loop_path_generator(d,"bottom")})
				.on('click',variant_click)
				.on('mouseover', function(d) {
					var text = d.split + " reads";
					var x = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom");
					var y = y_coordinate_for_connection("bottom") + _padding.tooltip;
					show_tooltip(text,x,y,svg);
				})
				.on('mouseout', function(d) {svg.selectAll("g.tip").remove();});



		// Mark other connections as feet and short stubby lines straight up
		svg.selectAll("path.spansplit_stub_top")
			.data(top_chrom_to_other)
			.enter()
			.append("path")
				.filter(function(d){ 
					if (_scales.zoom_plots["top"].x(d.pos1) > 0 && _scales.zoom_plots["top"].x(d.pos1) < both_zoom_canvas_width) {
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
				.on('click',variant_click)
				.on('mouseover', function(d) {
					var text = d.split + " reads";
					var x = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"top");
					var y = y_coordinate_for_connection("top") - _padding.tooltip;
					show_tooltip(text,x,y,svg);
				})
				.on('mouseout', function(d) {svg.selectAll("g.tip").remove();});


		svg.selectAll("path.spansplit_stub_bottom")
			.data(bottom_chrom_to_other)
			.enter()
			.append("path")
				.filter(function(d){ 
					if (_scales.zoom_plots["bottom"].x(d.pos1) > 0 && _scales.zoom_plots["bottom"].x(d.pos1) < both_zoom_canvas_width) {
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
				.on('click',variant_click)
				.on('mouseover', function(d) {
					var text = d.split + " reads";
					var x = both_zoom_left_x_coordinate+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom");
					var y = y_coordinate_for_connection("bottom") + _padding.tooltip;
					show_tooltip(text,x,y,svg);
				})
				.on('mouseout', function(d) {svg.selectAll("g.tip").remove();});

}

function variant_click(d) {
	var data = d;
	// var header = ["chrom1","start1","stop1","chrom2","start2","stop2","variant_name","score","strand1","strand2","variant_type","split"];
	var header = ["variant_type","variant_name","score","split","chrom1","chrom2"];
	d3.select("#variant_detail_text").html("");
	var rows = d3.select("#variant_detail_text").append("table").selectAll("tr").data(header).enter().append("tr");
	rows.append("th").html(function(d) {return d;});
	rows.append("td").html(function(d) {return data[d];});

	// console.log(JSON.stringify(d));
	d3.select("#data_to_send_ribbon").html("");
	// this is only one .bedpe record, so we put [] around it and generalize the Ribbon-side code to arrays of bedpe objects
	d3.select("#data_to_send_ribbon").append("input").attr("type","hidden").attr("name","splitthreader").property("value", JSON.stringify([data].concat(connection_data)));
	d3.select("#send_to_ribbon_panel").style("display","block");
}

var arrow_path_generator = function(d, top_or_bottom) {
		// console.log("arrow path generator")

		var arrowhead_size = 5;
		var arrow_head = d.start;
		var arrow_butt = d.end;
		if (d.strand == "+") {
			// console.log(d.gene)
			// console.log("forward")
			arrow_head = d.end;
			arrow_butt = d.start;
			arrowhead_size = -1 * arrowhead_size;
		} else if (d.strand == "-"){
			// console.log(d.gene)
			// console.log("reverse")
		}

		var x1 = _scales.zoom_plots["top"].x(arrow_butt),  // start (arrow butt)
				x2 = _scales.zoom_plots["top"].x(arrow_head),  // end (arrow head)
				y = gene_offset;
				

		if (top_or_bottom == "bottom") {
			x1 = _scales.zoom_plots["bottom"].x(arrow_butt);  // start (arrow butt)
			x2 = _scales.zoom_plots["bottom"].x(arrow_head);  // end (arrow head)
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

	var top_or_bottom = "top";

	zoom_plot_canvas["top"].selectAll("g." + top_or_bottom + "_chosen_genes").remove();
	zoom_plot_canvas["top"].selectAll("g." + top_or_bottom + "_local_genes").remove();


	var local_annotation = [];
	for (var i in annotation_by_chrom[chosen_chromosomes["top"]]) {
		var d = annotation_by_chrom[chosen_chromosomes["top"]][i];
		if (_scales.zoom_plots["top"].x(d.start) > 0 && _scales.zoom_plots["top"].x(d.end) < both_zoom_canvas_width) {
			local_annotation.push(d);
		}
	}

	if (local_annotation.length > 30) {
		d3.select("#top_local_genes").html(local_annotation.length + " genes. Double-click on plot to zoom and view details.");  
	} else {
		d3.select("#top_local_genes").html("");
		d3.select("#top_local_genes").selectAll("li").data(local_annotation).enter()
			.append("li")
				.html(function(d) {return d.gene + ", " })
				.on("click", user_add_gene);
	}



	var genes_top = zoom_plot_canvas["top"].selectAll("g.top_chosen_genes")
		.data(relevant_annotation).enter()
		.append("g")
			.filter(function(d){return d.show && d.chromosome == chosen_chromosomes["top"] && _scales.zoom_plots["top"].x(d.start) > 0 && _scales.zoom_plots["top"].x(d.end) < both_zoom_canvas_width})
			.attr("class","top_chosen_genes");				

	genes_top.append("text")
		.text(function(d){return d.gene})
		.attr("x",function(d){return _scales.zoom_plots["top"].x((d.start+d.end)/2)})
		.attr("y",(gene_offset/2))
		.attr("class","gene_label")
		.style('text-anchor',"middle")
		.attr("dominant-baseline","middle");
		
	genes_top.append("path")
		.attr("class","gene_arrow")
		.attr("d",function(d) {return arrow_path_generator(d,top_or_bottom="top")})
		.style("stroke-width",2)
		.style("stroke","black")
		.style("fill","none");



	// var show_local = false;
	// for (type in _settings.show_gene_types) {
	// 	if (_settings.show_gene_types[type] == true) {
	// 		show_local = true;
	// 		break;
	// 	}
	// }

	// if (show_local) {
	// 	var gene_arrows_top = zoom_plot_canvas["top"].selectAll("path.top_gene_arrow")
	// 		.data(local_annotation).enter()
	// 		.append("path")
	// 			.filter(function(d){return _settings.show_gene_types[d.type] && d.chromosome == chosen_chromosomes["top"] && _scales.zoom_plots["top"].x(d.start) > 0 && _scales.zoom_plots["top"].x(d.end) < both_zoom_canvas_width})
	// 			// .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
	// 			.attr("class","top_gene_arrow")
	// 			.attr("d",function(d) {return arrow_path_generator(d,top_or_bottom="top")})
	// 			.style("stroke-width",2)
	// 			.style("stroke","black")
	// 			.style("fill","none");

	// 	if (_settings.show_local_gene_names) {

	// 	}
	// }


}

var draw_genes_bottom = function() {
	zoom_plot_canvas["bottom"].selectAll("text.bottom_gene_label").remove();
	zoom_plot_canvas["bottom"].selectAll("path.bottom_gene_arrow").remove();


	var local_annotation = [];
	for (var i in annotation_by_chrom[chosen_chromosomes["bottom"]]) {
		var d = annotation_by_chrom[chosen_chromosomes["bottom"]][i];
		if (_scales.zoom_plots["bottom"].x(d.start) > 0 && _scales.zoom_plots["bottom"].x(d.end) < both_zoom_canvas_width) {
			local_annotation.push(d);
		}
	}


	if (local_annotation.length > 30) {
		d3.select("#bottom_local_genes").html(local_annotation.length + " genes. Double-click on plot to zoom and view details.");  
	} else {
		d3.select("#bottom_local_genes").html("");
		d3.select("#bottom_local_genes").selectAll("li").data(local_annotation).enter()
			.append("li")
				.html(function(d) {return d.gene + ", "})
				.on("click",user_add_gene);
	}
	



	var genes_bottom = zoom_plot_canvas["bottom"].selectAll("text.bottom_gene_label")
		.data(relevant_annotation).enter()
		.append("text")
			.filter(function(d){return d.show && d.chromosome == chosen_chromosomes["bottom"] && _scales.zoom_plots["bottom"].x(d.start) > 0 && _scales.zoom_plots["bottom"].x(d.end) < both_zoom_canvas_width})
			// .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
			.text(function(d){return d.gene})
			.attr("x",function(d){return _scales.zoom_plots["bottom"].x((d.start+d.end)/2)})
			.attr("y",(both_zoom_canvas_height-gene_offset/2))
			.attr("class","bottom_gene_label")
			.style('text-anchor',"middle")
			.attr("dominant-baseline","middle");

	var show_local = false;
	for (type in _settings.show_gene_types) {
		if (_settings.show_gene_types[type] == true) {
			show_local = true;
			break;
		}
	}
	if (show_local) {
		var gene_arrows_bottom = zoom_plot_canvas["bottom"].selectAll("path.bottom_gene_arrow")
		.data(local_annotation).enter()
		.append("path")
			.filter(function(d){return _settings.show_gene_types[d.type] &&  d.chromosome == chosen_chromosomes["bottom"] && _scales.zoom_plots["bottom"].x(d.start) > 0 && _scales.zoom_plots["bottom"].x(d.end) < both_zoom_canvas_width})
			// .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
			.attr("class","bottom_gene_arrow")
			.attr("d",function(d) {return arrow_path_generator(d,top_or_bottom="bottom")})
			.style("stroke-width",2)
			.style("stroke","black")
			.style("fill","none")
	}

	var gene_arrows_bottom = zoom_plot_canvas["bottom"].selectAll("path.bottom_gene_arrow")
		.data(relevant_annotation).enter()
		.append("path")
			.filter(function(d){return d.show &&  d.chromosome == chosen_chromosomes["bottom"] && _scales.zoom_plots["bottom"].x(d.start) > 0 && _scales.zoom_plots["bottom"].x(d.end) < both_zoom_canvas_width})
			// .filter(function(d){return genes_to_show.indexOf(d.gene)!=-1})
			.attr("class","bottom_gene_arrow")
			.attr("d",function(d) {return arrow_path_generator(d,top_or_bottom="bottom")})
			.style("stroke-width",2)
			.style("stroke","black")
			.style("fill","none")

}

var select_chrom_for_zoom_top = function(d) {
	chosen_chromosomes["top"] = d;
	if (coverage_by_chromosome[d] == undefined) {
		// console.log("Loading " + d + " from file");
		_data_ready.coverage["top"] = false;
		load_coverage(d,"top");
		wait_then_draw_top();
	} else {
		// console.log(d+" already loaded");
		draw_top_zoom();
	}
}

function wait_then_draw_top() {
	if (_data_ready.coverage["top"]) {
		draw_top_zoom();
	} else {
		window.setTimeout(wait_then_draw_top,300)  
	}
}

var select_chrom_for_zoom_bottom = function(d) {
	chosen_chromosomes["bottom"] = d;
	if (coverage_by_chromosome[d] == undefined) {
		// console.log("Loading " + d + " from file");
		_data_ready.coverage["bottom"] = false;
		load_coverage(d,"bottom");
		wait_then_draw_bottom();
	} else {
		// console.log(d+" already loaded");
		draw_bottom_zoom();
	}
}

function wait_then_draw_bottom() {
	if (_data_ready.coverage["bottom"]) {
		draw_bottom_zoom();
	} else {
		window.setTimeout(wait_then_draw_bottom,300)  
	}
}

function update_genes() {

	draw_genes_top();
	draw_genes_bottom();  

	d3.select("#genes_labeled").selectAll("li").remove();

	d3.select("#genes_labeled").selectAll("li").data(relevant_annotation).enter()
		.append("li")
			.html(function(d){return d.gene})
			.style("color",function(d) {if (d.show) {return "black"} else {return "white"}})
			.on("click",function(d,i) {toggle_gene_highlighting(i)});

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

	if (chosen_chromosomes["top"] != d.chrom1) {
		select_chrom_for_zoom_top(d.chrom1);
	} else {
		var coordinate = _scales.zoom_plots["top"].x(annotation_by_gene[d.gene1].start);
		if (coordinate < 0 || coordinate > both_zoom_canvas_width) {
			select_chrom_for_zoom_top(d.chrom1);
		}
	}

	if (chosen_chromosomes["bottom"] != d.chrom2) {
		select_chrom_for_zoom_bottom(d.chrom2);  
	} else {
		var coordinate = _scales.zoom_plots["bottom"].x(annotation_by_gene[d.gene2].start);
		if (coordinate < 0 || coordinate > both_zoom_canvas_width) {
			select_chrom_for_zoom_bottom(d.chrom2);
		}
	}

	user_message("Info", "Highlighting gene fusion: " + d.gene1 + " - " + d.gene2)

	// change_genes_shown([d.gene1,d.gene2]);

	update_genes();

	variants_to_highlight = d.variant_names;
	draw_connections();

	// gene_fusion_to_highlight = d;
}


function user_message(message_type,message) {
	if (message_type == "") {
		d3.select("#user_message").html("").style("visibility","hidden");
	} else {
		d3.select("#user_message").style("visibility","visible");
		var message_style = "default";
		switch (message_type) {
			case "error":
				message_style="danger";
				break;
			case "Error":
				message_style="danger";
				break;
			case "warning","Warning":
				message_style="warning";
				break;
			default:
				message_style="info";
		}
		d3.select("#user_message").html("<strong>"+ message_type + ": </strong>" + message).attr("class","alert alert-" + message_style);
	}
}

function search_select_gene(d) {
	// console.log("selected gene " + d.gene);
	user_add_gene(d);
}
function search_select_fusion1(d) {
	// console.log("selected gene " + d.gene + " as fusion gene 1");
	fusion_genes[1] = d;
	d3.select("#gene_fusion_table").select("#gene" + 1).html(d.gene);
	user_add_gene(d);
}
function search_select_fusion2(d) {
	// console.log("selected gene " + d.gene + " as fusion gene 2");
	fusion_genes[2] = d;
	d3.select("#gene_fusion_table").select("#gene" + 2).html(d.gene);
	user_add_gene(d);
}
function create_gene_search_boxes() {
	var gene_livesearch = d3.livesearch().max_suggestions_to_show(15).search_list(annotation_data).search_key("gene").placeholder(annotation_data[0].gene);
	// console.log(gene_livesearch);
	d3.select("#gene_livesearch").call(gene_livesearch.selection_function(search_select_gene));
	d3.select("#fusion_gene1_livesearch").call(gene_livesearch.selection_function(search_select_fusion1));
	d3.select("#fusion_gene2_livesearch").call(gene_livesearch.selection_function(search_select_fusion2));
}

function variant_type_checkbox(d) {
	_settings.show_variant_types[d] = d3.event.target.checked;
	draw_connections();
}
function make_variant_table() {
	var type_counts = {};
	_settings.show_variant_types = {};
	for (var i in connection_data) {
		if (type_counts[connection_data[i].variant_type] == undefined) {
			type_counts[connection_data[i].variant_type] = 1;
			_settings.show_variant_types[connection_data[i].variant_type] = true;
		} else {
			type_counts[connection_data[i].variant_type]++;
		}
	}
	var header = ["type","count","show"];
	d3.select("#variant_table").html("");
	d3.select("#variant_table").append("tr").selectAll("th").data(header).enter().append("th").html(function(d) {return d});
	var rows = d3.select("#variant_table").selectAll("tr.data").data(d3.keys(type_counts)).enter().append("tr").attr("class","data");
	rows.append("td").html(function(d) {return d});;
	rows.append("td").html(function(d) {return type_counts[d]});
	rows.append("td").append("input").property("type","checkbox").property("checked",true).on("change",variant_type_checkbox);
}


d3.select("#show_local_gene_names").on("change",function() {
	_settings.show_local_gene_names = d3.event.target.checked;
	update_genes();
});

function gene_type_checkbox(d) {
	_settings.show_gene_types[d] = d3.event.target.checked;
	update_genes();
}
function make_gene_type_table() {
	var type_counts = {};
	_settings.show_gene_types = {};
	for (var i in annotation_data) {
		if (type_counts[annotation_data[i].type] == undefined) {
			type_counts[annotation_data[i].type] = 1;
			_settings.show_gene_types[annotation_data[i].type] = false;
		} else {
			type_counts[annotation_data[i].type]++;
		}
	}
	var header = ["type","count","show"];
	d3.select("#gene_type_table").html("");
	d3.select("#gene_type_table").append("tr").selectAll("th").data(header).enter().append("th").html(function(d) {return d});
	var rows = d3.select("#gene_type_table").selectAll("tr.data").data(d3.keys(type_counts)).enter().append("tr").attr("class","data");
	rows.append("td").html(function(d) {return d});;
	rows.append("td").html(function(d) {return type_counts[d]});
	rows.append("td").append("input").property("type","checkbox").property("checked",false).on("change",gene_type_checkbox);
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

//////////    Settings    ////////////////


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

function jump_to_gene(annotation_for_new_gene) {

		var shown_already = false
		var top_chromosome_readjust = false
		var bottom_chromosome_readjust = false

		// Is the gene already in view at the top?
		if (chosen_chromosomes["top"] == annotation_for_new_gene.chromosome) {
			var coordinate = _scales.zoom_plots["top"].x(annotation_for_new_gene.start);
			if (coordinate > 0 && coordinate < both_zoom_canvas_width) {
				shown_already = true;
			} else {
				// Top chromosome doesn't show the gene, but is on the right chromosome
				top_chromosome_readjust = true;
			}
		}
		// Is the gene already in view at the bottom?
		if (shown_already == false) {
			if (chosen_chromosomes["bottom"] == annotation_for_new_gene.chromosome) {
				var coordinate = _scales.zoom_plots["bottom"].x(annotation_for_new_gene.start);
				if (coordinate > 0 && coordinate < both_zoom_canvas_width) {
					shown_already = true;
				} else {
					// Bottom chromosome doesn't show the gene, but is on the right chromosome
					bottom_chromosome_readjust = true;
				}
			}
		}
		if (shown_already == false) {
			if (top_chromosome_readjust) {
				select_chrom_for_zoom_top(annotation_for_new_gene.chromosome);
			} else if (bottom_chromosome_readjust) {
				select_chrom_for_zoom_bottom(annotation_for_new_gene.chromosome);
			} else {
				select_chrom_for_zoom_top(annotation_for_new_gene.chromosome);
			}
		}
}


function toggle_gene_highlighting(gene_index_in_relevant_annotation) {
	if (relevant_annotation[gene_index_in_relevant_annotation].show == true) {
		relevant_annotation[gene_index_in_relevant_annotation].show = false;
	} else {
		relevant_annotation[gene_index_in_relevant_annotation].show = true;
	}
	update_genes();
}


function user_add_gene(annotation_for_new_gene) {

	if (annotation_for_new_gene != null) {

		for (var i in relevant_annotation) {
			if (annotation_for_new_gene.gene == relevant_annotation[i].gene) {
				console.log("added this gene already");
				jump_to_gene(annotation_for_new_gene);
				relevant_annotation[i].show = true;
				return;
			}
		}

		annotation_for_new_gene.show = true;
		relevant_annotation.push(annotation_for_new_gene);

		jump_to_gene(annotation_for_new_gene);

		update_genes();
	}
}

function submit_fusion() {
	if (fusion_genes[1] != undefined && fusion_genes[2] != undefined) {
		// console.log("Ask SplitThreader graph whether this is a fusion");
		
		fusion_genes[1].name = fusion_genes[1].gene;
		fusion_genes[2].name = fusion_genes[2].gene;

		var results = _SplitThreader_graph.gene_fusion(fusion_genes[1],fusion_genes[2]);
		var new_row = d3.select("#gene_fusion_table_results").insert("tr",":first-child").attr("class","record");
			new_row.append("td").html(fusion_genes[1].name).property("width","20%");
			new_row.append("td").html(fusion_genes[2].name).property("width","20%");
			new_row.append("td").html("distance: " + results.distance + "bp").property("width","60%");
		highlight_gene_fusion(results);
	} else {
		user_message("Instructions","Select genes first using the Gene 1 and Gene 2 input fields");
	}
}

d3.select("#submit_fusion").on("click",submit_fusion);

// function select_gene(index) {
// 	d3.select(".livesearch").html("").style("border","0px");

// 	d3.select("#search_input").property("value","");
 
// 	user_add_gene(annotation_data[index]);
// }



// d3.select("#search_input").on("keyup",function() { search_gene(this,"select_gene(") });

// d3.select("#fusion_gene1_box").select(".search_field").on("keyup",function() { search_gene(this,"select_fusion_gene(1,") });
// d3.select("#fusion_gene2_box").select(".search_field").on("keyup",function() { search_gene(this,"select_fusion_gene(2,") });


//////////    Populate navbar with visualizer settings    ////////////////

function populate_navbar() {

	// Separating bar
	d3.select("#navbar").append("li").attr("class","dropdown").append("a")
				.html("|")
													// .attr("class","dropdown-toggle")
													// .attr("data-toggle","dropdown")
													// .attr("href","")

	
	// Settings
	settings_link = d3.select("#navbar")
		.append("li")
			.attr("class","dropdown");

	settings_link
			.append("a")
				.html("Settings <span class='caret'></span>")
				.attr("class","dropdown-toggle")
				.attr("data-toggle","dropdown")
				.attr("href","");
		
	settings = settings_link.append("ul")
			.attr("class","dropdown-menu")
			.attr("id", "settings_dropdown_menu")
			.attr("role","menu");


	settings.append("li").attr("class","dropdown-header")
		.text("Features")

	settings.append("li").append("a")
		.attr("href",void(0))
		.attr("id","toggle_segment_copy_number")
		.on("click",toggle_segment_copy_number)
		.text("Show segmented read coverage");
	
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

}



run()