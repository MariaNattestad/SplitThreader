#! /usr/bin/env python
import argparse
# import gzip

def is_digit(number):
    try:
        int(number)
        return True
    except ValueError:
        return False

def run(args):
	f = open(args.csv)

	fout = open(args.out, 'w')
	fout.write("chromosome,start,end,segmented_coverage\n")
	
	current_chrom = ""
	current_start = -1
	current_end = -1
	current_segmented_coverage = -1
	for line in f:
		fields = line.strip().split(",")
		if not is_digit(fields[1]):
			# print "HEADER:", line.strip()
			continue
		chrom = fields[0]
		start_pos = int(fields[1])
		end_pos = int(fields[2])
		segmented_cov = int(fields[4])
		if current_chrom == "":
			# Beginning of file
			current_chrom = chrom
			current_start = start_pos
			current_segmented_coverage = segmented_cov
			current_end = end_pos
		if chrom != current_chrom or segmented_cov != current_segmented_coverage:
			# Save the entry
			fout.write(",".join(map(str,[current_chrom, current_start, current_end, current_segmented_coverage])) + "\n")
			# Reset
			current_chrom = chrom
			current_start = start_pos
			current_segmented_coverage = segmented_cov
			current_end = end_pos
		else:
			current_end = end_pos

	f.close()
	fout.close()

def main():
    parser=argparse.ArgumentParser(description="Consolidate segmented copy number and call CNVs")
    parser.add_argument("-csv",help="segmented copy number profile from segment_copy_number.R in .csv format",dest="csv",required=True)
    parser.add_argument("-out",help="Output filename",dest="out",required=True)
    parser.set_defaults(func=run)
    args=parser.parse_args()
    args.func(args)

if __name__=="__main__":
    main()

