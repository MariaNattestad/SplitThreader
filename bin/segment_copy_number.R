## try http:// if https:// URLs are not supported
# source("https://bioconductor.org/biocLite.R")
# biocLite("DNAcopy")


library(DNAcopy)

args<-commandArgs(TRUE)
filename <- args[1]

# average_alignment_length = as.numeric(args[2])

# print(average_alignment_length)
# if (class(average_alignment_length) != "numeric") {
#     stop("average_alignment_length (commandline argument 2) must be numeric")    
# }

############## FOR TESTING ###########
# filename <- "/Applications/XAMPP/htdocs/splitthreader/user_data/example2/SKBR3.mid_read_counts.10000_windows.bed"
# average_alignment_length <- 6457.59

# data_ = read.csv(filename, header=FALSE,sep="\t",stringsAsFactors=FALSE)
# names(data_) <- c("chromosome","start","end","coverage")

data_ = read.csv(filename, header=TRUE,stringsAsFactors=FALSE)
head(data_)

bin_size <- mean(data_$end - data_$start)

negligible <- 0.00001 # replace zeros because they screw up the data when we use log functions

filtered.data <- data_

# filtered.data$coverage[filtered.data$darkregion_count>0] <- negligible

filtered.data$coverage[filtered.data$coverage==0] <- negligible

covered_data <- filtered.data[filtered.data$coverage>negligible,]

chromosome.names <- names(table(covered_data$chromosome)[table(covered_data$chromosome)>100])


filtered.data <- filtered.data[filtered.data$chromosome %in% chromosome.names,]

unique(filtered.data$chromosome)



###### order by chromosome names ########
ordered_common_chromosome_names <- c(seq(1,100),paste("chr",seq(1,100),sep=""),paste("Chr",seq(1,100),sep=""),c("X","Y","M","MT","Chr0","chr0","0"))

all_chromosomes_some_ordered <- c(intersect(ordered_common_chromosome_names,unique(filtered.data$chromosome)),setdiff(unique(filtered.data$chromosome),ordered_common_chromosome_names))

filtered.data$chromosome <- factor(filtered.data$chromosome, levels=all_chromosomes_some_ordered)


filtered.data <- filtered.data[order(filtered.data$chromosome),]

###############

RPB <- filtered.data$coverage

CNV_norm   = log2(RPB / mean(RPB)) # RPB / mean(RPB)
CNV_smooth = smooth.CNA(CNA(
    genomdat=CNV_norm,
    chrom=filtered.data$chromosome,
    maploc=filtered.data$end,
    data.type='logratio'))
segs = segment(CNV_smooth, verbose=0, alpha=0.01, min.width=5)

####### 
# Need to sort thisShort by chr first:

thisShort = segs[[2]];
thisShort$chrom <- factor(thisShort$chrom,levels=all_chromosomes_some_ordered)

head(thisShort)




m <- matrix(data=0, nrow=nrow(filtered.data), ncol=1);
prevEnd <- 0;
for (i in 1:nrow(thisShort))
{
    thisStart <- prevEnd + 1;
    thisEnd <- prevEnd + thisShort$num.mark[i];
    m[thisStart:thisEnd, 1] <- 2^thisShort$seg.mean[i]; # thisShort$seg.mean[i]; 
    prevEnd = thisEnd;
}
fixed_curr <- m[, 1]



################ SANITY CHECK IN HER2 REGION ################
# 
# filtered.data[her2_indices,]
# thisShort[thisShort$chrom=="17" & thisShort$loc.start>35e6 & thisShort$loc.end<42e6,]
# 
# 
# 
# her2_indices <- as.character(filtered.data$chromosome)=="17" & filtered.data$start > 35e6 & filtered.data$start < 42e6
# 
# 
# 
# # chr17_indices <- as.character(filtered.data$chromosome)=="8"
# 
# plot(fixed_curr[her2_indices]*mean(RPB), type='l',col='red')
# points(filtered.data$coverage[her2_indices],type='l', col='black')

############################################################


filtered.data$segmented_coverage <- round(fixed_curr*mean(RPB))
filtered.data$coverage <- round(filtered.data$coverage)


# bincount_to_coverage_correction <- average_alignment_length/bin_size


# filtered.data$coverage <- filtered.data$coverage*bincount_to_coverage_correction
# filtered.data$coverage <- filtered.data$coverage*bincount_to_coverage_correction




write.table(filtered.data,paste(substr(filename,1,nchar(filename)-4),".segmented.csv",sep=""),row.names=FALSE,quote=FALSE,sep=',')



for (chrom in unique(filtered.data$chromosome)) {
    print(chrom)
    write.table(filtered.data[filtered.data$chromosome==chrom,],paste(substr(filename,1,nchar(filename)-4),".segmented.", chrom,".csv",sep=""),row.names=FALSE,quote=FALSE,sep=',')
}









