<!DOCTYPE html>

<html>


<!--    NAVIGATION BAR-->
<?php include "header.html";?>

<link href="css/splitthreader_visualizer.css" rel="stylesheet">
<link href="css/d3-livesearch.css" rel="stylesheet">

<div id="svg_landing"></div>

<div id="right_panel">
	
	<div id="user_message" class="alert alert-default" role="alert"></div>

	<div class="panel-group ">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#settings_box">Settings</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="settings_box">
				<div class="panel-body">
					<div class="checkbox">
						<label><input id="show_segmented_coverage" type="checkbox">Show segmented coverage</label>
					</div>

					<label for="color_scheme_dropdown">Annotation</label>
					<select class="form-control" id="annotation_dropdown">
				 	</select>
				</div>
			</div>
		</div>
	</div>


	<div class="panel-group ">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#variant_detail_box">Variants</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="variant_detail_box">
				<div class="panel-body">
					<table class="invisible_table">
				 		<tr>
				 			<td>Minimum variant size: </td>
				 			<td><input id="min_variant_size" type="text"></td>
				 		</tr>
				 		<tr>
				 			<td>Minimum split reads:</td>
				 			<td><input id="min_split_reads" type="text"></td>
				 		</tr>
				 	</table>

					<table id="variant_table"></table>

					<div id="variant_detail_text">Click on a variant to show detail</div>
					
					<div id="send_to_ribbon_panel">
						<p>Ribbon (<a href="http://genomeribbon.com">genomeribbon.com</a>) is a long-read alignment viewer that allows you to see all the reads mapping near a variant including their other alignments across the genome, and you can see detailed alignments for each read to determine which parts of the read are mapping where.</p>
						<form action="http://genomeribbon.com/index.php" method="post" target="_blank">
							<div id="data_to_send_ribbon">
								<!-- Hidden fields go here -->
							</div>
							<input type="submit" value="Send variant to Ribbon">	
						</form>

					</div>
				</div>
			</div>
		</div>
	</div>


	
	<div class="panel-group ">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#show_genes_box">Show genes</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="show_genes_box">
				<div class="panel-body">
					<div id="gene_livesearch"></div>

					<!-- <input id="search_input" class="search_field" type="text" placeholder="Find gene">
					<div class="livesearch"></div> -->
					<div>
					   <ul id="genes_labeled" class="gene_list"></ul>
					</div>

					
					<div>
						<h4> Top genes:</h4>
						<ul id="top_local_genes" class="gene_list"></ul>
					</div>
					<div>
						<h4>Bottom genes:</h4>
						<ul id="bottom_local_genes" class="gene_list"></ul>
					</div>
					<div id="gene_type_table_box">
						<table id="gene_type_table"></table>
					</div>
					<div class="checkbox">
						<label><input id="show_local_gene_names" type="checkbox">Show gene names</label>
					</div>

				</div>
			</div>
		</div>
	</div>


	<div class="panel-group ">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#gene_fusion_box">Gene fusions</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="gene_fusion_box">
				<div class="panel-body">
						<div id="fusion_gene1_livesearch" class="gene_search_box"></div>
						<div id="fusion_gene2_livesearch" class="gene_search_box"></div>
						<!-- <div id="fusion_gene1_box" class="gene_search_box">
							<input class="search_field" type="text" placeholder="Gene 1">
							<div class="livesearch"></div>
						</div>
						<div id="fusion_gene2_box" class="gene_search_box">
							<input class="search_field" type="text" placeholder="Gene 2">
							<div class="livesearch"></div>
						</div> -->

						<table id="gene_fusion_table">
							<tr id="input_row">
								<td width="20%" id="gene1">search gene above</td>
								<td width="20%" id="gene2">search gene above</td>
								<td width="60%"> <button id="submit_fusion">Submit</button></td>
							</tr>
						</table>
						<table id="gene_fusion_table_results">
							
						</table>
				</div>
			</div>
		</div>
	</div>



</div>





<script src="js/lib/d3.v3.min.js"></script>
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/bootstrap.min.js"></script>
<script src="js/lib/priority-queue.min.js"></script>

<script src="js/d3-livesearch.js"></script>

<script src="js/SplitThreader.js"></script>
<script src="js/SplitThreader_visualizer.js"></script>





