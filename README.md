

################################    Creating copy number input for SplitThreader    ################################

# Just do this filtering once:
BAM=analysis/bwamem.hg19.position_sorted.bam
samtools view -b -q 60 $BAM > ${BAM%.bam}.mq60.bam

BAM=${BAM%.bam}.mq60.bam
BASE=coverage/mq60/SKBR3_bwamem_hg19.position_sorted.mq60

# getting coverage for every basepair in the genome
## bedtools genomecov -d -ibam $BAM -g /seq/schatz/mnattest/reference_genomes/human/hg19.genome > $BASE.coverage

############### 1 kb bins ################
# making 1kb bins on the coverage
### awk 'BEGIN{num=1000;sum=0;possum=0}{if(NR!=1){if(possum==1000 || chrom!=$1){print chrom,pos,sum/possum,possum;sum=0;possum=0;}}

# Create a .csv file for the SplitThreader web app:
### awk 'BEGIN{start=0;print "chromosome,start,end,unsegmented_coverage"}{if(chrom!=$1){start=0}; print $1,start,$2,$3;start=$2;chr


############## 10 kb bins ################
# making 10kb bins on the coverage
awk 'BEGIN{num=10000;sum=0;possum=0}{if(NR!=1){if(possum==10000 || chrom!=$1){print chrom,pos,sum/possum,possum;sum=0;possum=0;}}{s

# Create a .csv file for the SplitThreader web app:
awk 'BEGIN{start=0;print "chromosome,start,end,unsegmented_coverage"}{if(chrom!=$1){start=0}; print $1,start,$2,$3;start=$2;chrom=$

####################################################################################################################