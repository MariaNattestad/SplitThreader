<!DOCTYPE html>

<html>


<!--    NAVIGATION BAR-->
<?php include "header.html";?>

<link href="css/splitthreader_visualizer.css" rel="stylesheet">
<link href="css/d3-livesearch.css" rel="stylesheet">

<div id="svg_landing"></div>

<div id="right_panel">
	
	<div class="panel_box"><div id="user_message" class="alert alert-default" role="alert"></div></div>


	<div class="panel-group ">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#show_genes_box">Variants</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="show_genes_box">
				<div class="panel-body">
					
					<table id="variant_table">
					</table>

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
								<td width="20%" id="gene1"></td>
								<td width="20%" id="gene2"></td>
								<td width="60%"> <button id="submit_fusion">Submit</button></td>
							</tr>
						</table>
						<table id="gene_fusion_table_results">
							
						</table>
				</div>
			</div>
		</div>
	</div>




	<div class="panel-group ">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h4 class="panel-title">
					<a data-toggle="collapse" class="active" href="#local_genes_box">Local genes</a>
				</h4>
			</div>
			<div class="panel-collapse collapse in" id="local_genes_box">
				<div class="panel-body">
					<h4> Top genes:</h4>
					<ul id="top_local_genes" class="gene_list"></ul>
					
					<h4>Bottom genes</h4>
					<ul id="bottom_local_genes" class="gene_list"></ul>
				</div>
			</div>
		</div>
	</div>



</div>





<script src="js/lib/d3.v3.min.js"></script>
<script src="js/lib/d3.tip.v0.6.3.js"></script>
<script src="js/lib/jquery.min.js"></script>
<script src="js/lib/bootstrap.min.js"></script>
<script src="js/lib/priority-queue.min.js"></script>

<script src="js/d3-livesearch.js"></script>

<script src="js/SplitThreader.js"></script>
<script src="js/SplitThreader_visualizer.js"></script>





