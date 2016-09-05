
function getUrlVars() {
		var vars = {};
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				vars[key] = value;
		});
		return vars;
}

var _input_file_prefix = "user_data/" + getUrlVars()["code"] + "/" + getUrlVars()["nickname"];

d3.select("#title").html(getUrlVars()["nickname"].replace(/_/g," "));


var _layout = {
	"svg": {"width":null, "height": null}, 
	"circos": {"size":null, "label_size":null, "radius": null}, 
	"zoom_plot": {"height": null, "width": null,"x":null,"bottom_y":null},
	"connections": {"stub_height": 10},
	"hist": {"x":null, "y":null, "width":null, "height":null}
};

var _padding = {};

var _static = {};
_static.color_collections = [["#ff9896", "#c5b0d5", "#8c564b", "#e377c2", "#bcbd22", "#9edae5", "#c7c7c7", "#d62728", "#ffbb78", "#98df8a", "#ff7f0e", "#f7b6d2", "#c49c94", "#dbdb8d", "#aec7e8", "#17becf", "#2ca02c", "#7f7f7f", "#1f77b4", "#9467bd"],["#ffff00","#ad0000","#bdadc6", "#00ffff", "#e75200","#de1052","#ffa5a5","#7b7b00","#7bffff","#008c00","#00adff","#ff00ff","#ff0000","#ff527b","#84d6a5","#e76b52","#8400ff","#6b4242","#52ff52","#0029ff","#ffcc66","#ff94ff","#004200","gray","black"],['#E41A1C', '#A73C52', '#6B5F88', '#3780B3', '#3F918C', '#47A266','#53A651', '#6D8470', '#87638F', '#A5548D', '#C96555', '#ED761C','#FF9508', '#FFC11A', '#FFEE2C', '#EBDA30', '#CC9F2C', '#AD6428','#BB614F', '#D77083', '#F37FB8', '#DA88B3', '#B990A6', '#999999']];
_static.color_schemes = [
	{"name":"Color scheme 1", "colors": 0},
	{"name":"Color scheme 2", "colors": 1},
	{"name":"Color scheme 3", "colors": 2},
];

_static.fraction_y_scale_height = 1.4;
_static.spansplit_bar_length = 10;
_static.foot_spacing_from_axis = 5;
_static.foot_length = 15;
_static.annotations_available = [{"name":"Human hg19 Gencode","ucsc":"hg19", "path":"resources/annotation/Human_hg19.genes.csv"}, {"name":"Human GRCh38 Gencode","ucsc":"hg38", "path":"resources/annotation/Human_GRCh38.genes.csv"}];



var _settings = {};
_settings.show_gene_types = {};
_settings.show_variant_types = {};
_settings.show_local_gene_names = true;
_settings.color_index = 0;
_settings.segment_copy_number = "segmented";
_settings.adaptive_coverage_scaling = true;
_settings.min_variant_size = -1;
_settings.min_split_reads = -1;
_settings.annotation_path = "resources/annotation/Human_hg19.genes.csv";
_settings.ucsc_database = "hg19";
_settings.coverage_divisor = 1;
_settings.cov_diff_for_CNV = 1;

var _scales = {};
_scales.zoom_plots = {"top":{"x":d3.scale.linear(), "y":d3.scale.linear()}, "bottom":{"x":d3.scale.linear(), "y":d3.scale.linear()}};
_scales.chromosome_colors = d3.scale.ordinal().range(_static.color_collections[_settings.color_index]);
_scales.connection_loops = {"top":d3.scale.linear(), "bottom":d3.scale.linear()};
_scales.hist = {"x": d3.scale.linear(), "y": d3.scale.linear()};

var _axes = {};
_axes.top = {"x":null, "y":null};
_axes.bottom = {"x":null, "y":null};
var _axis_labels = {};
_axis_labels.top = {"x":null, "y":null};
_axis_labels.bottom = {"x":null, "y":null};

_zoom_behaviors = {"top":d3.behavior.zoom(),"bottom":d3.behavior.zoom()};

///////////////////////    Data    ///////////////////////
// For plotting:
var _Genome_data = [];
var _Annotation_to_highlight = [];
var _Coverage_by_chromosome = {"segmented":{},"unsegmented":{}}; // we load each chromosome into here as needed
var _Variant_data = null;
var _Filtered_variant_data = null;
var _Annotation_data = null;
// For lookups and calculations:
var _SplitThreader_graph = new Graph();
var _Chromosome_start_positions = {};
var _Annotation_by_chrom = {};
var _Gene_fusions = [];
var _max_coverage_by_chrom = {};
var _Statistics = {};
// Current state:
var _data_ready = {"coverage": {"segmented": {"top": false, "bottom": false}, "unsegmented":{"top": false, "bottom": false}}, "spansplit": false};

var _current_fusion_genes = {};
var _chosen_chromosomes = {"top":null, "bottom":null};

var _dragging_chromosome = null; // Which chromosome are you dragging from the circos plot?
var _hover_plot = null; // Which plot (top or bottom) are you about to drop the chromosome onto?
var _bins_per_bar = {"top": 5, "bottom": 5};



// Elements on the page
var _svg;
var _circos_canvas;
var _zoom_containers = {"top":null,"bottom":null};
var _plot_canvas = {"top": null, "bottom": null};



///////////   Style connections and spansplit lines on the zoom plots   ///////////////


function responsive_sizing() {
	var panel_width_fraction = 0.30;
	var top_banner_size = 120;

	var w = window,
		d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0];


	var window_width = (w.innerWidth || e.clientWidth || g.clientWidth);
	_layout.svg.width = window_width*(1-panel_width_fraction)*0.97;
	_layout.svg.height = (w.innerHeight || e.clientHeight || g.clientHeight)*0.95 - top_banner_size;

	d3.select("#right_panel")
		.style("display","block")
		.style("width",window_width*panel_width_fraction*0.90 + "px")
		.style("height",_layout.svg.height + "px")
		.style("float","left");



	_padding.top = _layout.svg.height*0.10;
	_padding.bottom = _layout.svg.height*0.10; 
	_padding.left = _layout.svg.width*0.02; 
	_padding.right = _layout.svg.width*0.02; 
	_padding.tooltip = _layout.svg.height*0.05;
	_padding.between_circos_and_zoom_plots = _layout.svg.width*0.05; 
	_padding.gene_offset = _layout.svg.height*0.05;

	_layout.circos.size = _layout.svg.width*0.30; //Math.min(_layout.svg.width,_layout.svg.height)*0.50;

	_layout.circos.radius = _layout.circos.size / 2 - _padding.left;

	////////  Clear the svg to start drawing from scratch  ////////
	
	d3.select("#svg_landing").selectAll("svg").remove();

	////////  Create the SVG  ////////
	_svg = d3.select("#svg_landing")
		.append("svg:svg")
		.attr("width", _layout.svg.width)
		.attr("height", _layout.svg.height)

	_layout.zoom_plot.height = (_layout.svg.height-_padding.top-_padding.bottom)/3;
	_layout.zoom_plot.x = _layout.circos.size + _padding.between_circos_and_zoom_plots;
	_layout.zoom_plot.width = _layout.svg.width-_layout.zoom_plot.x-_padding.right;
	_layout.zoom_plot.button_size = _layout.zoom_plot.height/10;
	_layout.zoom_plot.button_margin = _layout.zoom_plot.button_size/3;


	////////  Top zoom plot  ////////

	_zoom_containers["top"] = _svg.append("g")
		// .attr("class","_zoom_containers["top"]")
		.attr("transform","translate(" + _layout.zoom_plot.x + "," + _padding.top + ")");

	////////  Bottom zoom plot  ////////

	_layout.zoom_plot.bottom_y = _layout.svg.height-_padding.bottom-_layout.zoom_plot.height;

	_zoom_containers["bottom"] = _svg.append("g")
		.attr("transform","translate(" + _layout.zoom_plot.x + "," + _layout.zoom_plot.bottom_y + ")");


	var max_loop = _layout.zoom_plot.bottom_y-_layout.zoom_plot.height-_padding.top;
	var min_loop = (max_loop)/10;
	_scales.connection_loops["top"]
		.range([min_loop,max_loop])
		.clamp(true);

	_scales.connection_loops["bottom"]
		.range([min_loop,max_loop])
		.clamp(true);

	////////  Set up circos canvas  ////////
	_circos_canvas = _svg.append("svg:g")
		.attr("transform", "translate(" + (_layout.circos.radius+_padding.left) + "," + (_layout.circos.radius+_padding.top) + ")");

	_layout.circos.label_size = _layout.circos.radius/5;


	////////  Histogram canvas  ////////
	_layout.hist.svg_height = 300;
	_layout.hist.svg_width = 400;
	_layout.hist.y_axis_space = _layout.hist.svg_width*0.20;
	_layout.hist.x_axis_space = _layout.hist.svg_height*0.20;
	_layout.hist.left_padding = _layout.hist.svg_width*0.05;
	_layout.hist.top_padding = _layout.hist.svg_height*0.05;
	_layout.hist.x = _layout.hist.y_axis_space;
	_layout.hist.width = _layout.hist.svg_width - _layout.hist.y_axis_space - _layout.hist.left_padding;

	_layout.hist.y =  _layout.hist.top_padding;
	_layout.hist.height = _layout.hist.svg_height - _layout.hist.x_axis_space - _layout.hist.top_padding;

	d3.select("#histogram_landing")
		.attr("width", _layout.svg.width)
		.attr("height", _layout.svg.height)

}

responsive_sizing();




//////////////////     Event listeners     //////////////////

_zoom_containers["top"].on("mouseover",function(){
	_hover_plot = "top";
});
_zoom_containers["bottom"].on("mouseover",function(){
	_hover_plot = "bottom";
});

d3.select("#send_to_ribbon_form").property("action","http://genomeribbon.com");
d3.select("#send_fusion_to_ribbon_form").property("action","http://genomeribbon.com");

d3.select("#hide_local_gene_names").on("change",function() {
	_settings.show_local_gene_names = !d3.event.target.checked;
	update_genes();
});

d3.select("#show_segmented_coverage").on("change",function() {
	if (d3.event.target.checked) {
		_settings.segment_copy_number = "segmented";
	} else {
		_settings.segment_copy_number = "unsegmented";
	}

	var signs = ["top","bottom"];
	for (var i in signs) {
		var top_or_bottom = signs[i];
		if (_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]] == undefined) {
			_data_ready.coverage[_settings.segment_copy_number][top_or_bottom] = false;
			if (_settings.segment_copy_number == "unsegmented") {
				load_coverage(_chosen_chromosomes[top_or_bottom],top_or_bottom);	
			}
			wait_then_draw(top_or_bottom);
		} else {
			update_coverage(top_or_bottom);
		}
	}
});

d3.select("#adaptive_coverage_scaling").on("change",function() {
	_settings.adaptive_coverage_scaling = d3.event.target.checked;
	update_coverage("top");
	update_coverage("bottom");
});




d3.select("select#annotation_dropdown").selectAll("option").data(_static.annotations_available).enter()
	.append("option")
		.text(function(d){return d.name})
		.property("value",function(d){return d.path})
		.attr("ucsc", function(d){return d.ucsc});

d3.select("select#annotation_dropdown").on("change",function(d) {
	if (_settings.annotation_path == _static.annotations_available[this.options[this.selectedIndex].value]) {
		user_message("Info","Already loaded this annotation");
	} else {
		_settings.annotation_path = this.options[this.selectedIndex].value;
		_settings.ucsc_database = this.options[this.selectedIndex].getAttribute("ucsc");
		d3.select("#ucsc_database").html(_settings.ucsc_database);
		show_positions();
		console.log("unload annotation");
		read_annotation_file();
	}
});

d3.select("select#color_scheme_dropdown").selectAll("option").data(_static.color_schemes).enter()
	.append("option")
		.text(function(d){return d.name})
		.property("value",function(d){return d.colors});


d3.select("select#color_scheme_dropdown").on("change",function(d) {
	_settings.color_index = this.options[this.selectedIndex].value;
	_scales.chromosome_colors.range(_static.color_collections[_settings.color_index]);
	responsive_sizing(); 
	draw_everything();
});



d3.select("#coverage_divisor").on("change", function() {
	_settings.coverage_divisor = parseInt(this.value);
	if (isNaN(_settings.coverage_divisor)) {
		_settings.coverage_divisor = 1;
	} else if (_settings.coverage_divisor < 1) {
		_settings.coverage_divisor = 1;
		this.value = _settings.coverage_divisor;
	}
	update_coverage("top");
	update_coverage("bottom");
});

function update_variants() {

	make_variant_table();
	draw_histogram();
	draw_connections();
	draw_circos_connections();
	if (_Filtered_variant_data.length > 5000) {
		user_message("Warning", "Too many variants to run SplitThreader graph computations (" + _Filtered_variant_data.length + ") Use the 'Settings' tab to filter them down by minimum split reads and variant size, and they will be drawn when there are 5000 variants or less.")
		return;
	} else {
		user_message("");
	}
	_SplitThreader_graph = new Graph();
	_SplitThreader_graph.from_genomic_variants(_Filtered_variant_data,_Genome_data);
}
d3.select("#min_variant_size").on("change",function() {
	_settings.min_variant_size = parseInt(this.value);
	if (isNaN(_settings.min_variant_size)) {
		_settings.min_variant_size = -1;
	}
	apply_variant_filters();
	update_variants();
	
});
d3.select("#min_split_reads").on("change",function() {
	_settings.min_split_reads = parseInt(this.value);
	if (isNaN(_settings.min_split_reads)) {
		_settings.min_split_reads = -1;
	}
	apply_variant_filters();
	update_variants();
});

d3.select("#submit_fusion").on("click",submit_fusion);



// Advanced settings:

d3.select("#ribbon_path").property("value","http://genomeribbon.com").
	on("change",function() {
	d3.select("#send_to_ribbon_form").property("action",d3.event.target.value);	
	d3.select("#send_fusion_to_ribbon_form").property("action",d3.event.target.value);	
});


////////// Calculate polar coordinates ///////////

function genome_to_angle(chromosome,position) {
	return ((_Chromosome_start_positions[chromosome]+position)/_Chromosome_start_positions["total"])*2*Math.PI;
}
function genome_to_circos_x(chromosome,position) {
	return (Math.cos(genome_to_angle(chromosome,position) - (Math.PI/2)));
}
function genome_to_circos_y(chromosome,position) {
	return (Math.sin(genome_to_angle(chromosome,position) - (Math.PI/2)));
}

///////////   Add tooltips   /////////////////

var _tooltip = {};
function show_tooltip(text,x,y,parent_object) {
	parent_object.selectAll("g.tip").remove();

	_tooltip.width = (text.length + 4) * (_layout.svg.width/150);
	_tooltip.height = (_layout.svg.height/30);

	if (x -_tooltip.width/2 < 0) {
		x = _tooltip.width/2;
	} else if (x + _tooltip.width/2 > parent_object.attr("width")) {
		x = parent_object.attr("width") - _tooltip.width/2;
	}
	if (y - _tooltip.height/2 < 0) {
		y = _tooltip.height/2;
	} else if (y + _tooltip.height/2 > parent_object.attr("height")) {
		y = parent_object.attr("height") - _tooltip.height/2;
	}

	_tooltip.g = parent_object.append("g").attr("class","tip");
	_tooltip.g.attr("transform","translate(" + x + "," + y +  ")").style("visibility","visible");
	
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

function run(){
	read_annotation_file();
	read_genome_file();
	read_spansplit_file();
	
	user_message("Info","Loading data");
	wait_then_run_when_all_data_loaded(); 
}

function draw_everything() {
		draw_circos();
		draw_zoom_plot("top");
		draw_zoom_plot("bottom");
		draw_connections();  
		draw_circos_connections();
		draw_histogram();
}


function wait_then_run_when_all_data_loaded() {
	// console.log("checking")
	if (_data_ready.coverage[_settings.segment_copy_number]["top"] & _data_ready.coverage[_settings.segment_copy_number]["bottom"] & _data_ready.spansplit) {
		// console.log("ready")
		draw_everything(); 
		
		if (_Filtered_variant_data.length > 5000) {
			user_message("Warning", "Too many variants to run SplitThreader graph computations (" + _Filtered_variant_data.length + ") Use the 'Settings' tab to filter them down by minimum split reads and variant size, and they will be drawn when there are 5000 variants or less.")
			return;
		} else {
			// for SplitThreader.js graph the variants should be: {"variant_name":"variant1","chrom1":"1","pos1":50100,"strand1":"-","chrom2":"2","pos2":1000,"strand2":"-"},
			_SplitThreader_graph.from_genomic_variants(_Filtered_variant_data,_Genome_data);	

			analyze_copynumber();
			analyze_variants();
			make_variant_table();
			show_statistics();
			user_message("Info","Loading data is complete")
		}
	} else {
		console.log("waiting for data to load")
		window.setTimeout(wait_then_run_when_all_data_loaded,300)  
	}
}

function apply_variant_filters() {
	_Filtered_variant_data = [];
	for (var i in _Variant_data) {
		var d = _Variant_data[i];
		var variant_size = Math.abs(d.pos2-d.pos1);
		if ((_Chromosome_start_positions[d.chrom1] != undefined && _Chromosome_start_positions[d.chrom2] != undefined) && d.split >= _settings.min_split_reads && (variant_size >= _settings.min_variant_size || d.chrom1 != d.chrom2)) {
			_Filtered_variant_data.push(d);
		}
	}
}

function read_genome_file() {
		d3.csv(_input_file_prefix + ".genome.csv", function(error,genome_input) {
		if (error) throw error;
		
		var sum_genome_size = 0;
		for (var i=0;i<genome_input.length;i++){
			genome_input[i].size = +genome_input[i].size;
			sum_genome_size += genome_input[i].size;
			// console.log(genome_input[i].chromosome);
		}

		_Genome_data = [];  // set global variable for accessing this elsewhere
		var cumulative_genome_size = 0;
		_Chromosome_start_positions = {};
		for (var i=0; i< genome_input.length;i++) {
			if (genome_input[i].size > sum_genome_size*0.01){ //only include chromosomes accounting for at least 1% of the total genome sequence
				_Genome_data.push({"chromosome":genome_input[i].chromosome, "size":genome_input[i].size, "cum_pos":cumulative_genome_size});
				_Chromosome_start_positions[genome_input[i].chromosome] = cumulative_genome_size;
				cumulative_genome_size += genome_input[i].size;
			}
		}
		_Chromosome_start_positions["total"] = cumulative_genome_size;

		draw_circos();

		if (_Genome_data.length == 0) {
			user_message("Error","No genome file");
		}
		else {
			_chosen_chromosomes["top"] = _Genome_data[0].chromosome;
			
			load_consolidated_coverage();

			// load_coverage(_Genome_data[0].chromosome,top_or_bottom="top")
			if (_Genome_data.length > 1) {
				_chosen_chromosomes["bottom"] = _Genome_data[1].chromosome;
				// load_coverage(_Genome_data[1].chromosome,top_or_bottom="bottom")
			} else {
				_chosen_chromosomes["bottom"] = _Genome_data[0].chromosome;
				// load_coverage(_Genome_data[0].chromosome,top_or_bottom="bottom")
			}
		}
	});
}

///////////////////   Load coverage  ////////////////////////////////
function load_consolidated_coverage() {
	d3.csv(_input_file_prefix + ".copynumber.segmented.consolidated.csv?id=" + Math.random(), function(error,coverage_input) {
		if (error) throw error;

		_Coverage_by_chromosome["segmented"] = {};
		for (var i=0;i<coverage_input.length;i++) {
			// Create an entry for this chromosome if there isn't one already
			if (_Coverage_by_chromosome["segmented"][coverage_input[i].chromosome] == undefined) {
				_Coverage_by_chromosome["segmented"][coverage_input[i].chromosome] = [];
			}
			_Coverage_by_chromosome["segmented"][coverage_input[i].chromosome].push({"chrom":coverage_input[i].chromosome, "start":parseInt(coverage_input[i].start), "end":parseInt(coverage_input[i].end), "coverage":coverage_input[i].segmented_coverage});
		}
		_data_ready.coverage["segmented"]["top"] = true;
		_data_ready.coverage["segmented"]["bottom"] = true;

	});
}

function load_coverage(chromosome,top_or_bottom) {

	// console.log("loading chromosome coverage from file");
	d3.csv(_input_file_prefix + ".copynumber.segmented." + chromosome + ".csv?id=" + Math.random(), function(error,coverage_input) {
			if (error) throw error;

			_Coverage_by_chromosome["unsegmented"][chromosome] = [];
			for (var i=0;i<coverage_input.length;i++) {
				// Make columns numerical:
				_Coverage_by_chromosome["unsegmented"][chromosome].push({});
				_Coverage_by_chromosome["unsegmented"][chromosome][i].start = +coverage_input[i].start
				_Coverage_by_chromosome["unsegmented"][chromosome][i].end = +coverage_input[i].end
				_Coverage_by_chromosome["unsegmented"][chromosome][i].coverage = +coverage_input[i].coverage
			}

			_data_ready.coverage["unsegmented"][top_or_bottom] = true;
		
	});
}

function read_spansplit_file() {
	d3.csv(_input_file_prefix + ".variants.csv?id=" + Math.random(), function(error,spansplit_input) {
		// chrom1,start1,stop1,chrom2,start2,stop2,variant_name,score,strand1,strand2,variant_type,split
		if (error) throw error;
		_Variant_data = [];
		for (var i=0;i<spansplit_input.length;i++) {
			spansplit_input[i].start1 = +spansplit_input[i].start1 
			spansplit_input[i].start2 = +spansplit_input[i].start2
			spansplit_input[i].stop1 = +spansplit_input[i].stop1 
			spansplit_input[i].stop2 = +spansplit_input[i].stop2
			spansplit_input[i].pos1 = Math.floor(spansplit_input[i].start1+spansplit_input[i].stop1)/2
			spansplit_input[i].pos2 = Math.floor(spansplit_input[i].start2+spansplit_input[i].stop2)/2
			spansplit_input[i].split = +spansplit_input[i].split
			spansplit_input[i].size = parseInt(Math.abs(spansplit_input[i].pos1 - spansplit_input[i].pos2));
			if (spansplit_input[i].chrom1 != spansplit_input[i].chrom2) {
				spansplit_input[i].size = -1;
			}
			if (spansplit_input[i].strand1 != "" && spansplit_input[i].strand2 != "") {
				_Variant_data.push(spansplit_input[i]);
			} else {
				console.log("Ignoring variant in input file because strands are not set");
				user_message("Warning","Ignoring variant in input file because strands are not set");
			}
		}
		apply_variant_filters();
		_data_ready.spansplit = true;
		populate_ribbon_link();
	});
}


function read_annotation_file() {
	console.log("looking for annotation file");
	if (_settings.annotation_path != "none") {
		user_message("Info","Loading annotation...");

		d3.csv(_settings.annotation_path, function(error,annotation_input) {

			if (error) {
				user_message("Error","Could not find annotation.");
				throw error;
			}

			// annotation_genes_available = []
			_Annotation_by_chrom = {};
			for (var i=0;i<annotation_input.length;i++) {
				annotation_input[i].start = +annotation_input[i].start;
				annotation_input[i].end = +annotation_input[i].end;
				if (_Annotation_by_chrom[annotation_input[i].chromosome] == undefined) {
					_Annotation_by_chrom[annotation_input[i].chromosome] = [];
				}
				_Annotation_by_chrom[annotation_input[i].chromosome].push(annotation_input[i]);
				// annotation_genes_available.push(annotation_input[i].gene)
			}
			_Annotation_data = annotation_input;
			_Annotation_data.sort(function(a,b){return a["gene"].length-b["gene"].length});

			create_gene_search_boxes();
			make_gene_type_table();
			user_message("Info","Finished reading annotation");

			_Annotation_to_highlight = [];

			// console.log(_Annotation_data[0])
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

function draw_circos() {
	
		///////////////////// Set up circos plot ////////////////////////////
				
		var drag = d3.behavior.drag()
			.origin(function(d){return d;})
			.on("dragstart",function(d) {
				// console.log("dragstart")
				// console.log(d.chromosome)
				_hover_plot = null; // reset _hover_plot so we only detect mouseover events after the chromosome has been picked up
				_dragging_chromosome = d.chromosome;
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
				select_chrom_for_zoom_plot(_dragging_chromosome,_hover_plot);
				_dragging_chromosome = null;
			})

		//////////////////  Load connections and plot them on circos ////////////////////////////

		var chromosome_labels = _circos_canvas.selectAll("g.circos_chromosome")
			.data(_Genome_data)
			.enter()
				.append("g")
					.attr("class","circos_chromosome")
					.attr("transform","translate(0,0)")
					.call(drag);

		var arc = d3.svg.arc()
				.outerRadius(_layout.circos.radius)
				.innerRadius(_layout.circos.radius-_layout.circos.label_size)
				.startAngle(function(d){return genome_to_angle(d.chromosome,0)})
				.endAngle(function(d){return genome_to_angle(d.chromosome,d.size)});

		chromosome_labels.append("path")
				.attr("fill", function(d) { return _scales.chromosome_colors(d.chromosome); } ) //set the color for each slice to be chosen from the color function defined above
				.attr("d", arc)
				.attr("class","chromosome_arc");
				// .call(drag)

		chromosome_labels.append("text")
			.attr("transform",function(d) {
				d.innerRadius = 0
				d.outerRadius = _layout.circos.radius;
				return "translate(" + arc.centroid(d) + ")";
			})
			 .attr("text-anchor", "middle")
				.attr("dominant-baseline","middle")
				.attr("class","chromosome_label")
				.text(function(d, i) { return d.chromosome; });
				// .call(drag)
}

///////////    Add connections to the circos plot   /////////////////////
function draw_circos_connections() {
	if (_Filtered_variant_data.length > 5000) {
		user_message("Warning", "Too many variants to draw (" + _Filtered_variant_data.length + ") Use the 'Settings' tab to filter them down by minimum split reads and variant size, and they will be drawn when there are 5000 variants or less.")
		return;
	} else {
		user_message("");
	}

	var connection_point_radius = _layout.circos.radius - _layout.circos.label_size;

	var circos_connection_path_generator = function(d) {

		var x1 = connection_point_radius*genome_to_circos_x(d.chrom1,d.pos1),
				y1 = connection_point_radius*genome_to_circos_y(d.chrom1,d.pos1),

				x2 = connection_point_radius*genome_to_circos_x(d.chrom2,d.pos2),
				y2 = connection_point_radius*genome_to_circos_y(d.chrom2,d.pos2);

		var xmid = 0,
				ymid = 0;
		
		return (
				 "M " + x1                          + " " + y1 
		 + " S " + xmid                        + " " + ymid + " " + x2                          + " " + y2)
	}

	_circos_canvas.selectAll("path.circos_connection").remove()


	_circos_canvas.selectAll("path.circos_connection")
		.data(_Filtered_variant_data)
		.enter()
		.append("path")
			.attr("class","circos_connection")
			.style("stroke-width",1)
			.style("stroke",function(d){return _scales.chromosome_colors(d.chrom1);})
			.style("fill","none")
			.attr("d",circos_connection_path_generator);		
}

////////////////  Draw the top zoom plot  ////////////////////

function draw_zoom_plot(top_or_bottom) {

	_zoom_containers[top_or_bottom].selectAll("*").remove();
	_plot_canvas[top_or_bottom] = _zoom_containers[top_or_bottom].append("g");

	var bp_min = d3.min(_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]],function(d){return d.start});

	var bp_max = d3.max(_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]],function(d){return d.end});
	

//////////////// Bin data to at most one bin per pixel ////////////////////////////
	var bp_per_genomic_bin = _Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]][0].end-_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]][0].start;

	var num_genomic_bins_per_pixel = Math.ceil((bp_max-bp_min)/bp_per_genomic_bin/_layout.zoom_plot.width);

	var new_coverage = [];
	
	for (var i=0;i<_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]].length-num_genomic_bins_per_pixel;i=i+num_genomic_bins_per_pixel) {
		new_coverage.push({"start":_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]][i].start,"end":_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]][i+num_genomic_bins_per_pixel].end,"coverage":d3.mean(_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]].slice(i,i+num_genomic_bins_per_pixel),function(d){return d.coverage})})
	}

	/////////////////////// Set scales //////////////////////////////////

	_scales.zoom_plots[top_or_bottom].x
		.domain([bp_min,bp_max])
		.range([0,_layout.zoom_plot.width])
	
	show_positions();

	var max_local_coverage = 0;
	for (var i in new_coverage) {
		if (new_coverage[i].coverage > max_local_coverage) {
			max_local_coverage = new_coverage[i].coverage ;
		}
	}
	_max_coverage_by_chrom[_chosen_chromosomes[top_or_bottom]] = max_local_coverage;

	_scales.zoom_plots[top_or_bottom].y
		.domain([0,max_local_coverage*_static.fraction_y_scale_height])
		.clamp(true)

	if (top_or_bottom == "top") {
		_scales.zoom_plots[top_or_bottom].y.range([_layout.zoom_plot.height,0]);
	} else {
		_scales.zoom_plots[top_or_bottom].y.range([0,_layout.zoom_plot.height]);
	}

	///////////////// Plot axes and labels ////////////////////////////////


	if (top_or_bottom == "top") {
		_axes[top_or_bottom].x = d3.svg.axis().scale(_scales.zoom_plots[top_or_bottom].x).orient(top_or_bottom).ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
		_axis_labels[top_or_bottom].x = _zoom_containers[top_or_bottom].append("g")
			.attr("class","axis")
			.attr("transform","translate(" + 0 + "," + 0 + ")")
			.call(_axes[top_or_bottom].x);

		_axes[top_or_bottom].y = d3.svg.axis().scale(_scales.zoom_plots[top_or_bottom].y).orient("left").ticks(8).tickSize(5,0,1);
		_axis_labels[top_or_bottom].y = _zoom_containers[top_or_bottom].append("g")
			.attr("class","axis")
			// .attr("transform","translate(" + 0 + "," + _layout.zoom_plot.height + ")")
			.call(_axes[top_or_bottom].y)

		_axis_labels[top_or_bottom].x.append("text")
				.text("Chromosome " + _chosen_chromosomes[top_or_bottom])
				.style('text-anchor',"middle")
				.attr("transform","translate("+ _layout.zoom_plot.width/2 + "," + -30 + ")")
	} else {
		_axes[top_or_bottom].x = d3.svg.axis().scale(_scales.zoom_plots[top_or_bottom].x).orient(top_or_bottom).ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"))
		_axis_labels[top_or_bottom].x = _zoom_containers[top_or_bottom].append("g")
			.attr("class","axis")
			.attr("transform","translate(" + 0 + "," + _layout.zoom_plot.height + ")")
			.call(_axes[top_or_bottom].x)

		_axes[top_or_bottom].y = d3.svg.axis().scale(_scales.zoom_plots[top_or_bottom].y).orient("left").ticks(8).tickSize(5,0,1)
		_axis_labels[top_or_bottom].y = _zoom_containers[top_or_bottom].append("g")
			.attr("class","axis")
			// .attr("transform","translate(" + 0 + "," + _layout.zoom_plot.height + ")")
			.call(_axes[top_or_bottom].y)

		_axis_labels[top_or_bottom].x.append("text")
			.text("Chromosome " + _chosen_chromosomes[top_or_bottom])
			.style('text-anchor',"middle")
			.attr("transform","translate("+ _layout.zoom_plot.width/2 + "," + 40 + ")")
	}


	/////////////////  Zoom  /////////////////

	update_coverage(top_or_bottom);
	

	var zoom_handler = function() {

		_axis_labels[top_or_bottom].x.call(_axes[top_or_bottom].x);
		var zoom_scale_factor = d3.event.scale;
		_bins_per_bar[top_or_bottom] = Math.ceil(num_genomic_bins_per_pixel/zoom_scale_factor);
		update_coverage(top_or_bottom);
		show_positions();
	};

	_zoom_behaviors[top_or_bottom]
		.x(_scales.zoom_plots[top_or_bottom].x)
		// .y(_scales.zoom_plots[top_or_bottom].y)
		.scaleExtent([1,num_genomic_bins_per_pixel*50]) // 50 = Max number of pixels a genomic bin can be zoomed to (used to be 1 pixel per bin, this allows greater zooming to see variants even if coverage information doesn't go down below 1 pixel per bin)
		.duration(100)
		.on("zoom", zoom_handler)
		.center([_layout.zoom_plot.width / 2, _layout.zoom_plot.height / 2])
		.size([_layout.zoom_plot.width, _layout.zoom_plot.height]);

	_plot_canvas[top_or_bottom].call(_zoom_behaviors[top_or_bottom]);
	
	_plot_canvas[top_or_bottom].on("wheel.zoom", function(d) {
		d3.event.preventDefault();
	})

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function coordinates(point, zoom) {
	var scale = zoom.scale(), translate = zoom.translate();
	return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
}

function find_point(coordinates, zoom) {
	var scale = zoom.scale(), translate = zoom.translate();
	return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
}

function zoom_click() {
	top_or_bottom = this.getAttribute('data-plot');
	_plot_canvas[top_or_bottom].call(_zoom_behaviors[top_or_bottom].event); // https://github.com/mbostock/d3/issues/2387

	var zoom = _zoom_behaviors[top_or_bottom];
	// Record the coordinates (in data space) of the center (in screen space).
	var center0 = zoom.center();
	var translate0 = zoom.translate();
	var coordinates0 = coordinates(center0, zoom);
	zoom.scale(zoom.scale() * Math.pow(2, +this.getAttribute("data-zoom")));

	// Translate back to the center.
	var center1 = find_point(coordinates0, zoom);
	_zoom_behaviors[top_or_bottom].translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);

	_plot_canvas[top_or_bottom].transition().duration(300).call(_zoom_behaviors[top_or_bottom].event);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//////////// Draw or redraw the coverage (at resoluton matching the current zoom level) ///////////////

function update_coverage (top_or_bottom) {

	_plot_canvas[top_or_bottom].selectAll("rect").remove();

	var genomic_bins_per_bar = _bins_per_bar[top_or_bottom];

	var xlim_start = _scales.zoom_plots[top_or_bottom].x.domain()[0];
	var xlim_end = _scales.zoom_plots[top_or_bottom].x.domain()[1];

	var new_coverage = [];
	var num_bins = _Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]].length-genomic_bins_per_bar;
	for (var i=0;i<_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]].length-genomic_bins_per_bar;i=i+genomic_bins_per_bar) {
		var start = _Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]][i].start;
		var end = _Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]][i+genomic_bins_per_bar-1].end;

		// if (start >= xlim_start && end <= xlim_end) {
		if ((start >= xlim_start && start <= xlim_end) || (end >= xlim_start && end <= xlim_end) || (start <= xlim_start && end >= xlim_end)) {
			new_coverage.push({"start":start,"end":end,"coverage":(d3.mean(_Coverage_by_chromosome[_settings.segment_copy_number][_chosen_chromosomes[top_or_bottom]].slice(i,i+genomic_bins_per_bar),function(d){return d.coverage})/_settings.coverage_divisor) });
		}
	}

	if (_settings.adaptive_coverage_scaling) {
		var max_local_coverage = 0;
		for (var i in new_coverage) {
			if (new_coverage[i].coverage > max_local_coverage) {
				max_local_coverage = new_coverage[i].coverage ;
			}
		}
		_scales.zoom_plots[top_or_bottom].y.domain([0,max_local_coverage*_static.fraction_y_scale_height]);
	} else {
		// Scale by overall max on chromosome:
		_scales.zoom_plots[top_or_bottom].y.domain([0,_max_coverage_by_chrom[_chosen_chromosomes[top_or_bottom]]*_static.fraction_y_scale_height]);

	}
	_axis_labels[top_or_bottom].y.call(_axes[top_or_bottom].y);
	

	// Plot background color:
	_plot_canvas[top_or_bottom].append("rect")
			.attr("width",_layout.zoom_plot.width)
			.attr("height",_layout.zoom_plot.height)
			.attr("class",top_or_bottom+"_zoom_canvas")

	// Zoom +/- buttons:
	var signs = ["+","-"];
	for (var i in signs) {
		var sign = signs[i];

		var button_group = _zoom_containers[top_or_bottom].append("g")
			.attr("transform",function() {
				var x_shift = ((sign === "-") ? (_layout.zoom_plot.width - _layout.zoom_plot.button_size - _layout.zoom_plot.button_margin) : (_layout.zoom_plot.width - _layout.zoom_plot.button_size*2 - _layout.zoom_plot.button_margin*2));
				var y_shift = ((top_or_bottom === "top") ? _layout.zoom_plot.button_margin : (_layout.zoom_plot.height - _layout.zoom_plot.button_size - _layout.zoom_plot.button_margin));
				return "translate(" + x_shift + "," + y_shift + ")";
			})
			.attr("class", "zoom_button")
			.attr("data-zoom",sign+"1")
			.attr("data-plot", top_or_bottom)
			.style("cursor","pointer");

		button_group.append("rect")
			.attr("width", _layout.zoom_plot.button_size)
			.attr("height", _layout.zoom_plot.button_size);

		button_group.append("text")
			.text(sign)
			.attr("x", _layout.zoom_plot.button_size/2)
			.attr("y", _layout.zoom_plot.button_size/2)
			.attr("text-anchor", "middle")
			.attr("dominant-baseline","middle");
	}

	d3.selectAll(".zoom_button").on('click', zoom_click);

	var coverage_rects = _plot_canvas[top_or_bottom].selectAll("coverage_rect")
		.data(new_coverage).enter()
		.append("rect")
			.attr("class","coverage_rect")
			.attr("x",function(d){
				var start_pos = _scales.zoom_plots[top_or_bottom].x(d.start);
				if (start_pos < 0) {
					start_pos = 0;
				}
				return start_pos;
			})
			.attr("width",function(d){
				var width = Math.ceil(_scales.zoom_plots[top_or_bottom].x(d.end)-_scales.zoom_plots[top_or_bottom].x(d.start));
				var start_pos = _scales.zoom_plots[top_or_bottom].x(d.start);
				if (start_pos < 0) {
					width = width + (start_pos)
					start_pos = 0;
				}
				var max_width = _layout.zoom_plot.width - start_pos;
				if (width > max_width) {
					return max_width;
				} else {
					return width;	
				}
			})
			.style("fill",function(d){return _scales.chromosome_colors(_chosen_chromosomes[top_or_bottom])})
			.style("stroke",function(d){return _scales.chromosome_colors(_chosen_chromosomes[top_or_bottom])});

	if (top_or_bottom == "top"){
		coverage_rects
			.attr("y",function(d){return _scales.zoom_plots[top_or_bottom].y(d.coverage)})
			.attr("height",function(d){return _layout.zoom_plot.height-_scales.zoom_plots[top_or_bottom].y(d.coverage)})	
	} else {
		coverage_rects
			.attr("y",0)
			.attr("height",function(d){return _scales.zoom_plots[top_or_bottom].y(d.coverage)})	
	}
	
	draw_connections();
	draw_genes(top_or_bottom);
}


////////////   Selects and uses the correct scale for x positions according to the lengths of the chromosomes, choosing between top and bottom plots ////////

function scale_position_by_chromosome(chromosome, position, top_or_bottom) {
	
	if (top_or_bottom == "top" && _chosen_chromosomes["top"] == chromosome){
		return _scales.zoom_plots["top"].x(position)
	} else if (top_or_bottom == "bottom" && _chosen_chromosomes["bottom"] == chromosome) {
		return _scales.zoom_plots["bottom"].x(position)
	} else {
		return null;
	}
}

function scale_coverage_by_chromosome(top_or_bottom,coverage) {

	if (top_or_bottom == "top"){
		return (-1*(_layout.zoom_plot.height-_scales.zoom_plots["top"].y(coverage)))
	} else if (top_or_bottom == "bottom") {
		return _scales.zoom_plots["bottom"].y(coverage)
	} else {
		return null;
	}
}




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
	return (Number(chromosome == _chosen_chromosomes["top"])*2-1)
}

/////////   Draw connections between top and bottom zoom plots   /////////////

function draw_connections() {

	if (_Filtered_variant_data.length > 5000) {
		user_message("Warning", "Too many variants to draw (" + _Filtered_variant_data.length + ") Use the 'Settings' tab to filter them down by minimum split reads and variant size, and they will be drawn when there are 5000 variants or less.")
		return;
	} else {
		user_message("");
	}

	var y_coordinate_for_connection = d3.scale.ordinal()
		.domain(["top","bottom"])
		.range([_layout.zoom_plot.height+_padding.top+_static.foot_spacing_from_axis,_layout.zoom_plot.bottom_y-_static.foot_spacing_from_axis])

	var y_coordinate_for_zoom_plot_base = d3.scale.ordinal()
		.domain(["top","bottom"])
		.range([_layout.zoom_plot.height+_padding.top,_layout.zoom_plot.bottom_y])


	//////////   Classify connections so we can plot them differently   ///////////

	var categorized_variant_data = {};
	categorized_variant_data.top_to_bottom = [];
	categorized_variant_data.within_top = [];
	categorized_variant_data.within_bottom = [];
	categorized_variant_data.top_to_other = [];
	categorized_variant_data.bottom_to_other = [];

	for (var i = 0;i < _Filtered_variant_data.length; i++) {
		var d = _Filtered_variant_data[i];
		if (_settings.show_variant_types[_Filtered_variant_data[i].variant_type] == false) {
			continue;
		}

		var within_view_1_top = false;
		var within_view_2_top = false;
		var within_view_1_bottom = false;
		var within_view_2_bottom = false;

		var variant_size = Math.abs(d.pos2-d.pos1);
		if (d.chrom1 == _chosen_chromosomes["top"] || d.chrom2 == _chosen_chromosomes["top"] || d.chrom1 == _chosen_chromosomes["bottom"] || d.chrom2 == _chosen_chromosomes["bottom"]) {
			var scaled_position_1_top = scale_position_by_chromosome(d.chrom1,d.pos1,"top");
			var scaled_position_1_bottom = scale_position_by_chromosome(d.chrom1,d.pos1,"bottom");

			var scaled_position_2_top = scale_position_by_chromosome(d.chrom2,d.pos2,"top");
			var scaled_position_2_bottom = scale_position_by_chromosome(d.chrom2,d.pos2,"bottom");

			if (scaled_position_1_top > 0 && scaled_position_1_top < _layout.zoom_plot.width)  {
				within_view_1_top = true;
			}
			if (scaled_position_1_bottom > 0 && scaled_position_1_bottom < _layout.zoom_plot.width){
				within_view_1_bottom = true;
			}
			if (scaled_position_2_top > 0 && scaled_position_2_top < _layout.zoom_plot.width) {
				within_view_2_top = true;
			}
			if (scaled_position_2_bottom > 0 && scaled_position_2_bottom < _layout.zoom_plot.width) {
				within_view_2_bottom = true;
			}


			//  1. Both within view looping on top chromosome
			//  2. Both within view looping on bottom chromosome
			//  3. Both within view as connection
			//  4. Both within view as reverse connection
			//  5. Others


			if ( (d.chrom1 == _chosen_chromosomes["top"] && d.chrom2 == _chosen_chromosomes["top"]) && (within_view_1_top && within_view_2_top) ){
				categorized_variant_data.within_top.push(d)
			} else if ( (d.chrom1 == _chosen_chromosomes["top"] && d.chrom2 == _chosen_chromosomes["bottom"]) && (within_view_1_top && within_view_2_bottom) ){
				categorized_variant_data.top_to_bottom.push(d) // save as a connection
			} else if ( (d.chrom1 == _chosen_chromosomes["bottom"] && d.chrom2 == _chosen_chromosomes["top"]) && (within_view_1_bottom && within_view_2_top) ){
				categorized_variant_data.top_to_bottom.push(reverse_chrom1_and_chrom2(d)) // save as a connection
			} else if ( (d.chrom1 == _chosen_chromosomes["bottom"] && d.chrom2 == _chosen_chromosomes["bottom"]) && (within_view_1_bottom && within_view_2_bottom)) {
				categorized_variant_data.within_bottom.push(d)
			} else {
				// Within top chromosome  
				if (d.chrom1 == _chosen_chromosomes["top"] && d.chrom2 == _chosen_chromosomes["top"]) {
					if (within_view_1_top && within_view_2_top) { ///////////////
							categorized_variant_data.within_top.push(d) /////////////////////
						} else if (within_view_1_top) {
							categorized_variant_data.top_to_other.push(d) // save 1 as top stub
						} else if (within_view_2_top) {
							categorized_variant_data.top_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
						} // else: don't save it anywhere since it won't be shown even as a stub 
				// Between the top and bottom plots
				} else if (d.chrom1 == _chosen_chromosomes["top"] && d.chrom2 == _chosen_chromosomes["bottom"]) {
						if (within_view_1_top && within_view_2_bottom) { ///////////////////
							categorized_variant_data.top_to_bottom.push(d) // save as a connection ///////////////
						} else if (within_view_1_top) {
							categorized_variant_data.top_to_other.push(d) // save 1 as top stub
						} else if (within_view_2_bottom) {
							categorized_variant_data.bottom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
						} // else: don't save it anywhere since it won't be shown even as a stub 
				// Within bottom chromosome
				} else if (d.chrom1 == _chosen_chromosomes["bottom"] && d.chrom2 == _chosen_chromosomes["bottom"]) {
					if (within_view_1_bottom && within_view_2_bottom) { //////////////////
							categorized_variant_data.within_bottom.push(d) //////////////////
						} else if (within_view_1_bottom) {
							categorized_variant_data.bottom_to_other.push(d) // save 1 as top stub
						} else if (within_view_2_bottom) {
							categorized_variant_data.bottom_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as bottom stub
						} // else: don't save it anywhere since it won't be shown even as a stub 
				
				} else if (d.chrom1 == _chosen_chromosomes["bottom"] && d.chrom2 == _chosen_chromosomes["top"]) {
						if (within_view_1_bottom && within_view_2_top) { ///////////////////
							categorized_variant_data.top_to_bottom.push(reverse_chrom1_and_chrom2(d)) // save as a connection ////////////////////
						} else if (within_view_2_top) { // 2 is top this time
							categorized_variant_data.top_to_other.push(reverse_chrom1_and_chrom2(d)) // save 2 as top stub 
						} else if (within_view_1_bottom) { // 1 is bottom this time
							categorized_variant_data.bottom_to_other.push(d) // save as bottom stub, 1 is already bottom, so no need to flip
						} // else: don't save it anywhere since it won't be shown even as a stub 
				// Top chromosome to another chromosome
				} else if (d.chrom1 == _chosen_chromosomes["top"] && within_view_1_top) {
					categorized_variant_data.top_to_other.push(d)
					// console.log("top to other")
					// console.log(d)
				} else if (d.chrom2 == _chosen_chromosomes["top"] && within_view_2_top) {
					categorized_variant_data.top_to_other.push(reverse_chrom1_and_chrom2(d))
					// console.log("top to other reversed")
					// console.log(reverse_chrom1_and_chrom2(d))
				// Bottom chromosome to another chromosome
				} else if (d.chrom1 == _chosen_chromosomes["bottom"] && within_view_1_bottom) {
					categorized_variant_data.bottom_to_other.push(d)
					// console.log("bottom to other")
					// console.log(d)
				} else if (d.chrom2 == _chosen_chromosomes["bottom"] && within_view_2_bottom) {
					categorized_variant_data.bottom_to_other.push(reverse_chrom1_and_chrom2(d))
					// console.log("bottom to other reversed")
					// console.log(reverse_chrom1_and_chrom2(d))
				}
			}
		} // end check that one of chromosomes is visible for this variant
	}

	// Line path generator for connections with feet on both sides to indicate strands
	function connection_path_generator(d) {
			var x1 = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,"top"),  // top
					y1 = y_coordinate_for_connection("top"),
					x2 = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom2,d.pos2,"bottom"),  // bottom
					y2 = y_coordinate_for_connection("bottom")
					direction1 = Number(d.strand1=="-")*2-1, // negative strands means the read is mappping to the right of the breakpoint
					direction2 = Number(d.strand2=="-")*2-1;

			return (
					 "M " + (x1+_static.foot_length*direction1) + " " + y1
			 + " L " + x1                          + " " + y1 
			 + " L " + x2                          + " " + y2
			 + " L " + (x2+_static.foot_length*direction2) + " " + y2)
	}

	function stub_path_generator(d,top_or_bottom) {

			var x1 = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,top_or_bottom),
					y1 = y_coordinate_for_connection(top_or_bottom);

			var x2 = x1,
					y2 = y1 + _layout.connections.stub_height*(Number(top_or_bottom=="top")*2-1)
					direction1 = Number(d.strand1=="-")*2-1; // negative strands means the read is mappping to the right of the breakpoint
					
			return (
					 "M " + (x1+_static.foot_length*direction1) + " " + y1
			 + " L " + x1                          + " " + y1 
			 + " L " + x2                          + " " + y2)
	}

	function loop_path_generator(d,top_or_bottom) {

			var x1 = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,top_or_bottom),
					y1 = y_coordinate_for_connection(top_or_bottom),

					x2 = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom2,d.pos2,top_or_bottom),
					y2 = y_coordinate_for_connection(top_or_bottom);

			var xmid = (x1+x2)/2;
			var ymid = y1;
			if (top_or_bottom == "top") {
				ymid = y1 + _scales.connection_loops["top"](Math.abs(d.pos1-d.pos2))
			} else {
				ymid = y1 - _scales.connection_loops["bottom"](Math.abs(d.pos1-d.pos2))
			}
					// ymid = y1 + loop_scale(Math.abs(d.pos1-d.pos2))*(Number(top_or_bottom=="top")*2-1),

			var direction1 = Number(d.strand1=="-")*2-1, // negative strands means the read is mappping to the right of the breakpoint
					direction2 = Number(d.strand2=="-")*2-1;

			return (
					 "M " + (x1+_static.foot_length*direction1) + " " + y1
			 + " L " + x1                          + " " + y1 
			 + " S " + xmid                        + " " + ymid + " " + x2                          + " " + y2
			 // + " L " + x2                          + " " + y2
			 + " L " + (x2+_static.foot_length*direction2) + " " + y2)
	}


	//////////////////   Draw direct connections between these two chromosomes   /////////////////////////

	// Clear previous lines
	_svg.selectAll("path.spansplit_connection").remove()
	_svg.selectAll("path.spansplit_stub_top").remove()
	_svg.selectAll("path.spansplit_stub_bottom").remove()
	_svg.selectAll("path.spansplit_loop_top").remove()
	_svg.selectAll("path.spansplit_loop_bottom").remove()


	// Draw new lines for connections
	_svg.selectAll("path.spansplit_connection")
		.data(categorized_variant_data.top_to_bottom)
		.enter()
		.append("path")
			.attr("class","spansplit_connection variant")
			.style("stroke-width",thickness_of_connections)
			.style("stroke",color_connections)
			.attr("fill","none")
			.attr("d",connection_path_generator)
			.on('click',variant_click)
			.on('mouseover', function(d) {
				var text = variant_tooltip_text(d);
				var x = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,"top");
				var y = y_coordinate_for_connection("top") - _padding.tooltip;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});


	_scales.connection_loops["top"].domain([0,d3.extent(categorized_variant_data.within_top,function(d){return Math.abs(d.pos1-d.pos2)})[1]]);
	_scales.connection_loops["bottom"].domain([0,d3.extent(categorized_variant_data.within_bottom,function(d){return Math.abs(d.pos1-d.pos2)})[1]]);

	// Draw loops within each chromosome 
	_svg.selectAll("path.spansplit_loop_top")
		.data(categorized_variant_data.within_top)
		.enter()
		.append("path")
			.attr("class","spansplit_loop_top  variant")
			.style("stroke-width",thickness_of_connections)
			.style("stroke",color_connections)
			.attr("fill","none")
			.attr("d",function(d){return loop_path_generator(d,"top")})
			.on('click',variant_click)
			.on('mouseover', function(d) {
				var text = variant_tooltip_text(d);
				var x = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,"top");
				var y = y_coordinate_for_connection("top") - _padding.tooltip;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});


	_svg.selectAll("path.spansplit_loop_bottom")
		.data(categorized_variant_data.within_bottom)
		.enter()
		.append("path")
			.attr("class","spansplit_loop_bottom variant")
			.style("stroke-width",thickness_of_connections)
			.style("stroke",color_connections)
			.attr("fill","none")
			.attr("d",function(d){return loop_path_generator(d,"bottom")})
			.on('click',variant_click)
			.on('mouseover', function(d) {
				var text = variant_tooltip_text(d);
				var x = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom");
				var y = y_coordinate_for_connection("bottom") + _padding.tooltip;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});


	// Mark other connections as feet and short stubby lines straight up
	_svg.selectAll("path.spansplit_stub_top")
		.data(categorized_variant_data.top_to_other)
		.enter()
		.append("path")
			.attr("class","spansplit_stub_top  variant")
			.style("stroke-width",thickness_of_connections)
			.style("stroke",color_connections)
			.attr("fill","none")
			.attr("d",function(d){return stub_path_generator(d,"top")})
			.on('click',variant_click)
			.on('mouseover', function(d) {
				var text = variant_tooltip_text(d);
				var x = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,"top");
				var y = y_coordinate_for_connection("top") - _padding.tooltip;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});


	_svg.selectAll("path.spansplit_stub_bottom")
		.data(categorized_variant_data.bottom_to_other)
		.enter()
		.append("path")
			.attr("class","spansplit_stub_bottom  variant")
			.style("stroke-width",thickness_of_connections)
			.style("stroke",color_connections)
			.attr("fill","none")
			.attr("d",function(d){ return stub_path_generator(d,"bottom")})
			.on('click',variant_click)
			.on('mouseover', function(d) {
				var text = variant_tooltip_text(d);
				var x = _layout.zoom_plot.x+scale_position_by_chromosome(d.chrom1,d.pos1,"bottom");
				var y = y_coordinate_for_connection("bottom") + _padding.tooltip;
				show_tooltip(text,x,y,_svg);
			})
			.on('mouseout', function(d) {_svg.selectAll("g.tip").remove();});

}

function variant_click(d) {
	var data = d;
	// var header = ["chrom1","start1","stop1","chrom2","start2","stop2","variant_name","score","strand1","strand2","variant_type","split"];
	var header = ["variant_type","variant_name","score","split","chrom1","chrom2"];
	d3.select("#variant_detail_text").html("");
	var rows = d3.select("#variant_detail_text").selectAll("p").data(header).enter().append("p");
	rows.append("span").html(function(d) {return d + ": ";});
	rows.append("span").html(function(d) {return data[d];});

	// var rows = d3.select("#variant_detail_text").append("table").selectAll("tr").data(header).enter().append("tr");
	// rows.append("th").html(function(d) {return d;});
	// rows.append("td").html(function(d) {return data[d];});
}

function arrow_path_generator(d, top_or_bottom) {
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

		var x1 = _scales.zoom_plots[top_or_bottom].x(arrow_butt),  // start (arrow butt)
		x2 = _scales.zoom_plots[top_or_bottom].x(arrow_head),  // end (arrow head)
		y = _padding.gene_offset;
		

		if (top_or_bottom == "bottom") {
			y = _layout.zoom_plot.height-_padding.gene_offset;
		}

		return (
				 "M " + x1                          + " " + y
		 + " L " + x2                          + " " + y 
		 + " L " + (x2 + arrowhead_size)         + " " + (y + arrowhead_size)
		 + " L " + x2                          + " " + y 
		 + " L " + (x2 + arrowhead_size)         + " " + (y - arrowhead_size))

}


function draw_genes(top_or_bottom) {

	_plot_canvas[top_or_bottom].selectAll("g." + top_or_bottom + "_chosen_genes").remove();
	_plot_canvas[top_or_bottom].selectAll("g." + top_or_bottom + "_local_genes").remove();

	
	/////////////////////    Draw genes in view according to settings    //////////////////////

	var local_annotation = [];
	for (var i in _Annotation_by_chrom[_chosen_chromosomes[top_or_bottom]]) {
		var d = _Annotation_by_chrom[_chosen_chromosomes[top_or_bottom]][i];
		if (_scales.zoom_plots[top_or_bottom].x(d.start) > 0 && _scales.zoom_plots[top_or_bottom].x(d.end) < _layout.zoom_plot.width) {
			local_annotation.push(d);
		}
	}

	// if (local_annotation.length > 30) {
	// 	d3.select("#" + top_or_bottom + "_local_genes").html(local_annotation.length + " genes. Double-click on plot to zoom and view details.");  
	// } else {
	// 	d3.select("#" + top_or_bottom + "_local_genes").html("");
	// 	d3.select("#" + top_or_bottom + "_local_genes").selectAll("li").data(local_annotation).enter()
	// 		.append("li")
	// 			.html(function(d) {return d.gene + ", " })
	// 			.on("click", user_add_gene);
	// }

	var show_local = false;
	for (type in _settings.show_gene_types) {
		if (_settings.show_gene_types[type] == true) {
			show_local = true;
			break;
		}
	}

	if (show_local) {
		var gene_labels = _plot_canvas[top_or_bottom].selectAll("g." + top_or_bottom + "_local_genes")
			.data(local_annotation).enter()
			.append("g")
				.filter(function(d){return _settings.show_gene_types[d.type] && d.chromosome == _chosen_chromosomes[top_or_bottom] && _scales.zoom_plots[top_or_bottom].x(d.start) > 0 && _scales.zoom_plots[top_or_bottom].x(d.end) < _layout.zoom_plot.width})
				.attr("class",top_or_bottom + "_local_genes")
			.on('mouseover', function(d) {
					var text = d.gene + " (" + d.type + ")";
					var x = _scales.zoom_plots[top_or_bottom].x((d.start+d.end)/2);
					var y = (top_or_bottom == "top") ? (_padding.gene_offset/2 - _padding.tooltip) : (_layout.zoom_plot.height-_padding.gene_offset/2 + _padding.tooltip);
					show_tooltip(text,x,y,_plot_canvas[top_or_bottom]);
				})
			.on('mouseout', function(d) {_plot_canvas[top_or_bottom].selectAll("g.tip").remove();});		


		if (_settings.show_local_gene_names) {
			var gene_label_text = gene_labels.append("text")
			.text(function(d){return d.gene})
			.attr("x",function(d){return _scales.zoom_plots[top_or_bottom].x((d.start+d.end)/2)})
			.attr("class","gene_label")
			.attr("dominant-baseline","middle");

			if (top_or_bottom == "top") {
				gene_label_text.attr("y",(_padding.gene_offset/2))
			} else {
				gene_label_text.attr("y",(_layout.zoom_plot.height-_padding.gene_offset/2))
			}
		}
		
		gene_labels.append("path")
			.attr("class","gene_arrow")
			.attr("d",function(d) {return arrow_path_generator(d,top_or_bottom)});		
	}


	/////////////////////    Draw highlighted genes (from search or gene fusions)    //////////////////////

	var gene_labels = _plot_canvas[top_or_bottom].selectAll("g." + top_or_bottom + "_chosen_genes")
		.data(_Annotation_to_highlight).enter()
		.append("g")
			.filter(function(d){return d.show && d.chromosome == _chosen_chromosomes[top_or_bottom] && _scales.zoom_plots[top_or_bottom].x(d.start) > 0 && _scales.zoom_plots[top_or_bottom].x(d.end) < _layout.zoom_plot.width})
			.attr("class",top_or_bottom + "_chosen_genes")
			.on('mouseover', function(d) {
					var text = d.gene + " (" + d.type + ")";
					var x = _scales.zoom_plots[top_or_bottom].x((d.start+d.end)/2);
					var y = (top_or_bottom == "top") ? (_padding.gene_offset/2 - _padding.tooltip) : (_layout.zoom_plot.height-_padding.gene_offset/2 + _padding.tooltip);
					show_tooltip(text,x,y,_plot_canvas[top_or_bottom]);
				})
			.on('mouseout', function(d) {_plot_canvas[top_or_bottom].selectAll("g.tip").remove();});		

	var gene_label_text = gene_labels.append("text")
		.text(function(d){return d.gene})
		.attr("x",function(d){return _scales.zoom_plots[top_or_bottom].x((d.start+d.end)/2)})
		.attr("class","gene_label")
		.attr("dominant-baseline","middle");

	if (top_or_bottom == "top") {
		gene_label_text.attr("y",(_padding.gene_offset/2))
	} else {
		gene_label_text.attr("y",(_layout.zoom_plot.height-_padding.gene_offset/2))
	}
	
	gene_labels.append("path")
		.attr("class","gene_arrow")
		.attr("d",function(d) {return arrow_path_generator(d,top_or_bottom)});
}

function select_chrom_for_zoom_plot(d,top_or_bottom) {
	_chosen_chromosomes[top_or_bottom] = d;
	if (_Coverage_by_chromosome[_settings.segment_copy_number][d] == undefined) {
		// console.log("Loading " + d + " from file");
		_data_ready.coverage[_settings.segment_copy_number][top_or_bottom] = false;
		if (_settings.segment_copy_number == "unsegmented") {
			load_coverage(d,top_or_bottom);	
		}
		wait_then_draw(top_or_bottom);
	} else {
		// console.log(d+" already loaded");
		draw_zoom_plot(top_or_bottom);
	}
}

function wait_then_draw(top_or_bottom) {
	if (_data_ready.coverage[_settings.segment_copy_number][top_or_bottom]) {
		draw_zoom_plot(top_or_bottom);
	} else {
		window.setTimeout(function() {wait_then_draw(top_or_bottom)} ,300)  ;
	}
}

function hide_all_genes() {
	_Annotation_to_highlight.forEach(function(d) {d.show = false});
}

function update_genes() {

	draw_genes("top");
	draw_genes("bottom");  

	d3.select("#genes_labeled").selectAll("li").remove();

	d3.select("#genes_labeled").selectAll("li").data(_Annotation_to_highlight).enter()
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


function highlight_gene_fusion(d) {
	select_chrom_for_zoom_plot(d.chrom1,"top");
	select_chrom_for_zoom_plot(d.chrom2,"bottom");  

	hide_all_genes();
	highlight_gene(d.annotation1);
	highlight_gene(d.annotation2);

	user_message("Info", "Highlighting gene fusion: " + d.gene1 + " - " + d.gene2)

	update_genes();

	var match_variant_names = {};
	for (var i in d.variant_names) {
		match_variant_names[d.variant_names[i]] = true;
	}
	for (var i in _Filtered_variant_data) {
		if (match_variant_names[_Filtered_variant_data[i].variant_name] != undefined) {
			_Filtered_variant_data[i].highlight = true;
		} else {
			_Filtered_variant_data[i].highlight = false;
		}
		// _Filtered_variant_data[i].highlight = (.indexOf(_Filtered_variant_data[i].variant_name) != -1);
	}

	draw_connections();
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
	highlight_gene(d);
	jump_to_gene(d);
}

function search_select_fusion1(d) {
	if (d != undefined) {
		// console.log("selected gene " + d.gene + " as fusion gene 1");
		_current_fusion_genes[1] = d;
		d3.select("#gene_fusion_input").select("#gene" + 1).html(d.gene);
		highlight_gene(d);
	}
}
function search_select_fusion2(d) {
	if (d != undefined) {
		// console.log("selected gene " + d.gene + " as fusion gene 2");
		_current_fusion_genes[2] = d;
		d3.select("#gene_fusion_input").select("#gene" + 2).html(d.gene);
		highlight_gene(d);
	}
}
function create_gene_search_boxes() {
	var gene_livesearch = d3.livesearch().max_suggestions_to_show(15).search_list(_Annotation_data).search_key("gene").placeholder("ERBB2");
	// console.log(gene_livesearch);
	d3.select("#gene_livesearch").call(gene_livesearch.selection_function(search_select_gene));
	d3.select("#fusion_gene1_livesearch").call(gene_livesearch.selection_function(search_select_fusion1));
	d3.select("#fusion_gene2_livesearch").call(gene_livesearch.selection_function(search_select_fusion2));
}

function variant_type_checkbox(d) {
	_settings.show_variant_types[d] = d3.event.target.checked;
	draw_connections();
}

function make_variant_type_filter_table() {

	var type_counts = {};
	_settings.show_variant_types = {};
	for (var i in _Filtered_variant_data) {
		if (type_counts[_Filtered_variant_data[i].variant_type] == undefined) {
			type_counts[_Filtered_variant_data[i].variant_type] = 1;
			_settings.show_variant_types[_Filtered_variant_data[i].variant_type] = true;
		} else {
			type_counts[_Filtered_variant_data[i].variant_type]++;
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

function choose_row(d) {
	for (var i in _Filtered_variant_data) {
		if (_Filtered_variant_data[i].variant_name == d.variant_name) {
			_Filtered_variant_data[i].highlight = true;
			jump_to_location(_Filtered_variant_data[i].chrom1,_Filtered_variant_data[i].pos1,"top");
			jump_to_location(_Filtered_variant_data[i].chrom2,_Filtered_variant_data[i].pos2,"bottom");
			$('.nav-tabs a[href="#visualizer_tab"]').tab('show');
		} else {
			_Filtered_variant_data[i].highlight = false;
		}
	}

	draw_connections();

}
function make_variant_table() {
	d3.select("#variant_table_landing").call(
		d3.superTable()
			.table_data(_Filtered_variant_data)
			.table_header(["chrom1","pos1","strand1","CNV_distance1","CNV_diff1","chrom2","pos2","strand2","CNV_distance2","CNV_diff2","variant_name","variant_type","split","size"])
			.num_rows_to_show(10)
			.show_advanced_filters(true)
			.click_function(choose_row)
	);

	make_variant_type_filter_table();
	
}

function populate_ribbon_link() {
	// console.log(JSON.stringify(d));
	d3.select("#data_to_send_ribbon").html("");
	d3.select("#data_to_send_ribbon").append("input").attr("type","hidden").attr("name","splitthreader").property("value", JSON.stringify(_Filtered_variant_data));
}

function draw_histogram() {

	if (_Filtered_variant_data.length > 5000) {
		return;
	} else {
		user_message("");
	}

	var variant_data_to_use = _Filtered_variant_data;

	if (variant_data_to_use == null) {
		return;
	}

	var num_bins = 50;
	var data_max = Math.ceil(d3.max(variant_data_to_use,function(d) {return d.size}));
	var bin_size = data_max/num_bins;
	// console.log(bin_size);


	var hist_data = new Array(num_bins).fill(0);

	for (var i in variant_data_to_use) {
		var bin = Math.floor(variant_data_to_use[i].size / bin_size);
		if (hist_data[bin] != undefined) {
			hist_data[bin]++;
		} //else {
		// 	hist_data[bin] = 1;
		// }
	}

	d3.select("#histogram_landing").select("#histogram").remove();

	var plot_container = d3.select("#histogram_landing").append("g").attr("id","histogram");

	plot_container.attr("transform","translate(" + _layout.hist.x + "," + _layout.hist.y + ")")
		.append("rect")
			.attr("x",0)
			.attr("y",0)
			.attr("width",_layout.hist.width)
			.attr("height",_layout.hist.height)
			.style("fill","#eeeeee");

	// console.log(Math.max.apply(null, hist_data));
	_scales.hist.x.domain([0, data_max]).range([0, 0 + _layout.hist.width]);
	_scales.hist.y.domain([0,Math.max.apply(null, hist_data)]).range([0+_layout.hist.height,0]);

	var x_axis = d3.svg.axis().scale(_scales.hist.x).orient("bottom").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"));
	var x_axis_label = plot_container.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + 0 + "," + (0 + _layout.hist.height) + ")")
		.call(x_axis);
	x_axis_label.append("text")
		.text("Variant size")
		.style('text-anchor',"middle")
		.attr("transform","translate(" + (0 + _layout.hist.width/2) + "," + 40 + ")")


	var y_axis = d3.svg.axis().scale(_scales.hist.y).orient("left").ticks(5).tickSize(5,0,0).tickFormat(d3.format("s"));
	var y_axis_label = plot_container.append("g")
		.attr("class","axis")
		.attr("transform","translate(" + 0 + "," + 0 + ")")
		.call(y_axis);
	y_axis_label.append("text")
		.text("Count")
		.style('text-anchor',"middle")
		.attr("transform","translate("+ -40 + "," + (0 + _layout.hist.height/2) + ")rotate(-90)")


	var plot_canvas = plot_container.append("g");

	plot_canvas.selectAll("rect.bar").data(hist_data).enter()
		.append("rect")
			.attr("class","bar")
			.attr("x",function(d,i){return _scales.hist.x(i)*bin_size})
			.attr("y",function(d,i){return _scales.hist.y(d)})
			.attr("width",_layout.hist.width/num_bins)
			.attr("height", function(d,i) {return (_layout.hist.height - _scales.hist.y(d))})
			.style("fill","black");
}

function gene_type_checkbox(d) {
	_settings.show_gene_types[d.type] = d3.event.target.checked;
	update_genes();
}
function make_gene_type_table() {
	var type_counts = {};
	_settings.show_gene_types = {};
	var min_to_show_separately = 1000;

	for (var i in _Annotation_data) {
		if (type_counts[_Annotation_data[i].type] == undefined) {
			type_counts[_Annotation_data[i].type] = 1;
			_settings.show_gene_types[_Annotation_data[i].type] = false;
		} else {
			type_counts[_Annotation_data[i].type]++;
		}
	}
	// type_counts["other"] = 0;
	// for (var type in type_counts) {
	// 	if (type_counts[type] < min_to_show_separately) {
	// 		type_counts["other"] += type_counts[type];
	// 		delete type_counts[type];
	// 	}
	// }

	// Put into list so we can sort it
	var data_for_table = [];
	for (var type in type_counts) {
		data_for_table.push({"type":type,"count":type_counts[type]})
	}
	data_for_table.sort(function(a, b){return b.count-a.count});

	var header = ["type","count","show"];
	d3.select("#gene_type_table").html("");
	d3.select("#gene_type_table").append("tr").selectAll("th").data(header).enter().append("th").html(function(d) {return d});
	var rows = d3.select("#gene_type_table").selectAll("tr.data").data(data_for_table).enter().append("tr").attr("class","data");
	rows.append("td").html(function(d) {return d.type});
	rows.append("td").html(function(d) {return d.count});
	rows.append("td").append("input").property("type","checkbox").property("checked",false).on("change",gene_type_checkbox);
}

function color_connections(d) {

		if (d.highlight) {
				return "black";
		} else {
				return _scales.chromosome_colors(d.chrom2); 
		}
}

function thickness_of_connections(d) {

		if (d.highlight){
				return 4;
		} else {
				return 2;
		}
}

function jump_to_location(chrom, pos, top_or_bottom) {
	
	select_chrom_for_zoom_plot(chrom,top_or_bottom);


	// _scales.zoom_plots[top_or_bottom].x.domain([pos-10000,pos+10000]);
	// _plot_canvas[top_or_bottom].call(_zoom_behaviors[top_or_bottom].event);
	// _zoom_behaviors[top_or_bottom].translate([pos-10000,pos+10000]);

	// 
	var chrom_size = 0;
	for (var i in _Genome_data) {
		if (_Genome_data[i].chromosome == chrom) {
			chrom_size = _Genome_data[i].size;
		}
	}

	_zoom_behaviors[top_or_bottom].scale(chrom_size/2000000);
	_zoom_behaviors[top_or_bottom].translate([(_layout.zoom_plot.width/2 -_scales.zoom_plots[top_or_bottom].x(pos)), 0]);

	_plot_canvas[top_or_bottom].transition().duration(300).call(_zoom_behaviors[top_or_bottom].event);
	
}

function jump_to_gene(annotation_for_new_gene) {

	jump_to_location(annotation_for_new_gene.chromosome, annotation_for_new_gene.start, "top");
	
}



function toggle_gene_highlighting(gene_index_in_relevant_annotation) {
	if (_Annotation_to_highlight[gene_index_in_relevant_annotation].show == true) {
		_Annotation_to_highlight[gene_index_in_relevant_annotation].show = false;
	} else {
		_Annotation_to_highlight[gene_index_in_relevant_annotation].show = true;
	}
	update_genes();
}

function highlight_gene(annotation_for_new_gene) {

	if (annotation_for_new_gene != null) {

		for (var i in _Annotation_to_highlight) {
			if (annotation_for_new_gene.gene == _Annotation_to_highlight[i].gene) {
				// jump_to_gene(annotation_for_new_gene);
				_Annotation_to_highlight[i].show = true;
				return;
			}
		}

		annotation_for_new_gene.show = true;
		_Annotation_to_highlight.push(annotation_for_new_gene);

		update_genes();
	}
}

function read_gene_fusion_file(raw_input) {
	var input_text = raw_input.split("\n");

	var failed_gene_names = [];
	for (var i = 0; i < input_text.length; i++) {
		if (input_text[i][0] == "#") {
			continue;
		}

		var columns = input_text[i].split(/\s+|,|--/);

		var gene1 = columns[0];
		var gene2 = columns[1];

		var gene1_annotation = undefined;
		var gene2_annotation = undefined;

		if (gene1 != "" && gene2 != "") {

			for (var j in _Annotation_data) {
				if (_Annotation_data[j].gene === gene1) {
					gene1_annotation = _Annotation_data[j];
				}
				if (_Annotation_data[j].gene === gene2) {
					gene2_annotation = _Annotation_data[j];
				}
			}

			if (gene1_annotation != undefined && gene2_annotation != undefined) {
				_current_fusion_genes[1] = gene1_annotation;
				_current_fusion_genes[2] = gene2_annotation;
				search_graph_for_fusion();
			} else {
				if (gene1_annotation == undefined) {
					failed_gene_names.push(gene1);
					gene1 = gene1 + " is not in the annotation";
				}
				if (gene2_annotation == undefined) {
					failed_gene_names.push(gene2);
					gene2 = gene2+ " is not in the annotation";
				}

				_Gene_fusions.push({"gene1":gene1, "gene2":gene2});
			}
		}
	}

	if (failed_gene_names.length == 0) {
		user_message("Success","All genes found in annotation");
	} else {
		user_message("The following genes were not found in the annotation: " + failed_gene_names.join(","));
	}

	update_fusion_table();

}


function open_gene_fusion_file(event) {
	console.log("in open_gene_fusion_file");
		
	var raw_data;
	var reader = new FileReader();

	if (this.files[0].size > 100000) {
		user_message("Error","This file is larger than 100kb. Please choose a smaller file. This should only be a small list of gene fusions with the names of the genes in the first two columns.");
		return;
	}

	reader.readAsText(this.files[0]);
	reader.onload = function(event) {
		raw_data = event.target.result;
		read_gene_fusion_file(raw_data);
	}
}

d3.select("#gene_fusion_file").on("change",open_gene_fusion_file);

d3.select("#gene_fusion_file_icon").on("click", function() {
	user_message("Instructions","The file should have a pair of genes on each line separated by tabs, commas, or spaces, with the gene names in the first two columns matching the annotation.");
});


function search_graph_for_fusion() {
	if (_current_fusion_genes[1] != undefined && _current_fusion_genes[2] != undefined) {

		_current_fusion_genes[1].name = _current_fusion_genes[1].gene;
		_current_fusion_genes[2].name = _current_fusion_genes[2].gene;
		if (_Filtered_variant_data.length > 5000) {
			user_message("Warning", "Too many variants to run SplitThreader graph computations (" + _Filtered_variant_data.length + ") Use the 'Settings' tab to filter them down by minimum split reads and variant size, and they will be drawn when there are 5000 variants or less.")
			return;
		} else {
			user_message("");
		}
		var results = _SplitThreader_graph.gene_fusion(_current_fusion_genes[1],_current_fusion_genes[2]);

		_Gene_fusions.push(results);
		user_message("Instructions","Click on table to highlight the gene fusion path found through the SplitThreader graph.");
		
	} else {
		user_message("Instructions","Select genes first using the Gene 1 and Gene 2 input fields");
	}
}

function update_fusions_for_Ribbon() {
	d3.select("#send_fusion_to_ribbon_form").style("display","block");
	var variants_for_Ribbon = [];
	for (var j in _Gene_fusions) {
		for (var i in _Filtered_variant_data) {
			if (_Gene_fusions[j].variant_names.indexOf(_Filtered_variant_data[i].variant_name) != -1) {
				var fusion_variant = JSON.parse(JSON.stringify(_Filtered_variant_data[i]));
				fusion_variant.variant_name = _Gene_fusions[j].gene1 + "-" + _Gene_fusions[j].gene2 + ": " + fusion_variant.variant_name;
				variants_for_Ribbon.push(fusion_variant);
			}
		}
	}
	d3.select("#fusion_data_to_send_ribbon").html("");
	d3.select("#fusion_data_to_send_ribbon").append("input").attr("type","hidden").attr("name","splitthreader").property("value", JSON.stringify(variants_for_Ribbon));
}
function update_fusion_table() {
	d3.select("#gene_fusion_table_landing").call(
		d3.superTable()
			.table_data(_Gene_fusions)
			.table_header(["gene1","gene2","distance","num_variants","path_chromosomes"])
			.show_advanced_filters(true)
			.click_function(highlight_gene_fusion)
	);

	update_fusions_for_Ribbon();

}

function submit_fusion() {
	search_graph_for_fusion();
	update_fusion_table();
}

function variant_tooltip_text(d) {
	if (d.chrom1 == d.chrom2) {
		return d.split + " reads, " + Mb_format(d.size) + " " + d.variant_type;	
	} else {
		return d.split + " reads, interchromosomal";
	}
}

function Mb_format(x) {
	if (x > 1000000) {
		return Math.round(x/1000000,2) + " Mbp";	
	} else if (x > 1000) {
		return Math.round(x/1000,2) + " kbp";
	} else {
		return x + " bp";
	}
	
}
function show_positions() {
	var options = ["top","bottom"];
	for (var i in options){
		var top_or_bottom = options[i];
		var pos = _scales.zoom_plots[top_or_bottom].x.domain();
		d3.select("#" + top_or_bottom + "_position").html(_chosen_chromosomes[top_or_bottom] + ":   " + Mb_format(pos[0]) + "-" + Mb_format(pos[1]));
		d3.select("#ucsc_go_" + top_or_bottom).property("href",'https://genome.ucsc.edu/cgi-bin/hgTracks?db=' + _settings.ucsc_database + '&position=chr' + _chosen_chromosomes["top"] + '%3A' + Math.floor(pos[0]) + '-' + Math.floor(pos[1]));
	}
}

function binary_search_closest(search_list,b,e,pos) {
	var mid = Math.floor((b+e)/2);
	// console.log("b:",b, " e:", e);
	// console.log(mid);
	// console.log(search_list[mid]);
	if (pos == search_list[mid].start) {
		// console.log("equals");
		return {"diff": search_list[mid].coverage - search_list[mid-1].coverage, "distance":  Math.abs(search_list[mid].start-pos)};
	} else if (e-b <= 1) {
		// console.log("e-b <= 1");
		if (search_list[b] == undefined) {
			console.log("search_list[b] == undefined");
			console.log("b = " + b);
			console.log(search_list);
		}
		if (search_list[e] == undefined) {
			console.log("search_list[e] == undefined");
			console.log("e = " + e);
			console.log("total length: " + search_list.length);
			console.log(search_list);
		}
		if (Math.abs(search_list[b].start-pos) <= Math.abs(search_list[e].start-pos)) {
			return {"diff": search_list[b].coverage - search_list[b-1].coverage, "distance":  Math.floor(Math.abs(search_list[b].start-pos))};
		} else {
			return {"diff": search_list[e].coverage - search_list[e-1].coverage, "distance":  Math.floor(Math.abs(search_list[e].start-pos))};
		}
	} else if (pos < search_list[mid].start) {
		// console.log("<");
		return binary_search_closest(search_list, b, mid, pos);
	} else if (pos > search_list[mid].start) {
		// console.log(">");
		return binary_search_closest(search_list, mid, e, pos);
	} else {
		console.log("ELSE");
	}
}

function show_statistics() {

	d3.select("#mean_copynumber").html(" " + Math.round(_Statistics.mean_copynumber,2) + "X");
	d3.select("#number_of_variants").html(" " + _Statistics.number_of_variants);

	// d3.select("#statistics_landing").selectAll("p").data(d3.keys(_Statistics)).enter().append("p").html(function(d) {return d + ": " + Math.round(_Statistics[d])});
}

function analyze_copynumber() {
	
	console.log("analyzing copy number");

	var cov = _Coverage_by_chromosome["segmented"];


	var weighted_total_copynumber = 0;
	var total_bases = 0;

	var mean_by_chrom = {};

	for (var chrom in cov) {
		var total_bases_this_chrom = 0;
		var weighted_total_copynumber_this_chrom= 0;
		for (var i in cov[chrom]) {
			var this_length = (cov[chrom][i].end - cov[chrom][i].start);
			total_bases_this_chrom += this_length;
			weighted_total_copynumber_this_chrom += this_length*cov[chrom][i].coverage;
		}
		mean_by_chrom[chrom] = weighted_total_copynumber_this_chrom/total_bases_this_chrom;
		total_bases += total_bases_this_chrom;
		weighted_total_copynumber += weighted_total_copynumber_this_chrom;
	}

	// _Statistics.copynumber_by_chrom = mean_by_chrom;
	_Statistics.mean_copynumber = weighted_total_copynumber/total_bases;
}

function analyze_variants() {

	_Statistics.number_of_variants = _Filtered_variant_data.length;

	// Calculate distance to nearest CNV
	// where CNV is defined as a change in segmented coverage of at least _settings.cov_diff_for_CNV
	for (var i in _Filtered_variant_data) {
		if (_Coverage_by_chromosome["segmented"][_Filtered_variant_data[i].chrom1] == undefined) {
			_Filtered_variant_data[i].CNV_distance1 = "no coverage for chromosome";
		} else {
			var closest_CNV_1 = binary_search_closest(_Coverage_by_chromosome["segmented"][_Filtered_variant_data[i].chrom1], 1, _Coverage_by_chromosome["segmented"][_Filtered_variant_data[i].chrom1].length -1, _Filtered_variant_data[i].pos1);
			_Filtered_variant_data[i].CNV_distance1 = closest_CNV_1.distance;
			_Filtered_variant_data[i].CNV_diff1 = closest_CNV_1.diff;
			if (_Filtered_variant_data[i].strand1 == "+") {
				_Filtered_variant_data[i].CNV_diff1 = -closest_CNV_1.diff;
			}
		}

		if (_Coverage_by_chromosome["segmented"][_Filtered_variant_data[i].chrom2] == undefined) {
			_Filtered_variant_data[i].CNV_distance2 = "no coverage for chromosome";
		} else {
			var closest_CNV_2 = binary_search_closest(_Coverage_by_chromosome["segmented"][_Filtered_variant_data[i].chrom2], 1, _Coverage_by_chromosome["segmented"][_Filtered_variant_data[i].chrom2].length-1, _Filtered_variant_data[i].pos2);
			_Filtered_variant_data[i].CNV_distance2 = closest_CNV_2.distance;
			_Filtered_variant_data[i].CNV_diff2 = closest_CNV_2.diff;
			if (_Filtered_variant_data[i].strand2 == "+") {
				_Filtered_variant_data[i].CNV_diff2 = -closest_CNV_2.diff;
			}
		}
	}

	// ????????????????????????????
}


// Resize SVG and sidebar when window size changes
window.onresize = resizeWindow;
function resizeWindow()
{
	responsive_sizing();
	draw_everything();

}



run()