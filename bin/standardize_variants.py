#! /usr/bin/env python
import argparse

# the standard .isdigit() does not work for negative numbers
# and sometimes alternative chromosomes in Lumpy will have an interval that extends to -1

def is_digit(number):
    try:
        int(number)
        return True
    except ValueError:
        return False

def run(args):
    
    is_a_lumpy_file = True
    contains_possible_numreads_column = True

    ID_names = set()

    line_counter = 0
    f = open(args.bedpe)
    for line in f:
        if line[0] == "#":
            continue
        fields = line.strip().split()
        if len(fields) < 12:
            print "ERROR: Variant file must have at least 12 columns. Use output from Lumpy or Sniffles"
            return        
        ################## Requirements for all bedpe files: ######################

        # fields[0] is a chromosome name

        # fields[1] and fields[2] are positions, check they are numbers
        if not is_digit(fields[1]):
            print "ERROR: Column 2 must be a genomic position, but it is not a number:", fields[1]
            print line
            return
        if not is_digit(fields[2]):
            print "ERROR: Column 3 must be a genomic position, but it is not a number:", fields[2]
            return

        # fields[3] is a chromosome name
        
        # fields[4] and fields[5] are positions, check they are numbers        
        if not is_digit(fields[4]):
            print "ERROR: Column 5 must be a genomic position, but it is not a number:", fields[4]
            return
        if not is_digit(fields[5]):
            print "ERROR: Column 6 must be a genomic position, but it is not a number:", fields[5]
            return

        # fields[6] is the ID name, this is standardized as a count in each of the clean_* functions
        ID_names.add(fields[6])

        # fields[7] is a score that we don't use, so ignore this column

        # fields[8] and fields[9] are strands, so check they are + and -
        if fields[8] not in ["+","-"] or fields[9] not in ["+","-"]:
            print "ERROR: Columns 9 and 10 must only contain + or -"
            return

        # fields[10] is a variant type, ignore this for now
        #################################################################################################
        
        #########################  see if we can find the number of split reads  ########################

        # fields[11] should be num_reads, we can fill this in from a Lumpy file through fields[12] (see next step)
        if not fields[11].isdigit():
            contains_possible_numreads_column = False

        # fields[12] contains info about STRANDS (including number of reads of support for each one) if this is a Lumpy output file
        if len(fields) < 13:
            is_a_lumpy_file = False
        elif fields[12].find("STRANDS") == -1:
            is_a_lumpy_file = False

        #################################################################################################
        line_counter += 1

    f.close()


    overwrite_ID_names = False
    if len(ID_names) != line_counter:
        overwrite_ID_names = True
        print "NOTE: IDs in column 7 are not unique, replacing with numbers"

    if is_a_lumpy_file:
        clean_lumpy(args,overwrite_ID_names=overwrite_ID_names)
    elif contains_possible_numreads_column:
        clean_sniffles(args,overwrite_ID_names=overwrite_ID_names)
    else:
        print "ERROR: This file needs column 12 to have the number of split reads supporting each variant, or it can be a Lumpy output file with the STRANDS tag included within column 13. This file has neither."
        return

def remove_chr(chromosome):
    if chromosome[0:3] in ["chr","Chr","CHR"]:
        chromosome = chromosome[3:]
    return chromosome

def clean_sniffles(args,overwrite_ID_names):
    f = open(args.bedpe)
    fout = open(args.out,"w")
    fout.write("chrom1,start1,stop1,chrom2,start2,stop2,variant_name,score,strand1,strand2,variant_type,split\n")

    ID_counter = 1
    for line in f:
        if line[0] == "#":
            continue
        fields = line.strip().split()
        fields[0] = remove_chr(fields[0])
        fields[3] = remove_chr(fields[3])
        if overwrite_ID_names:
            fields[6] = ID_counter
        ID_counter += 1
        fields_to_output = fields[0:12]
        fout.write(",".join(map(str,fields_to_output)) + "\n")
    f.close()
    fout.close()


def clean_lumpy(args,overwrite_ID_names):
    f = open(args.bedpe)
    fout = open(args.out,"w")

    fout.write("chrom1,start1,stop1,chrom2,start2,stop2,variant_name,score,strand1,strand2,variant_type,split\n")

    ID_counter = 1
    for line in f:
        if line[0] == "#":
            continue
        fields = line.strip().split()
        if fields[7] == ".":
            fields[7] = 0
        fields[0] = remove_chr(fields[0])
        fields[3] = remove_chr(fields[3])
        ID_field = fields[6]
        num_reads = None
        for tag in fields[12].split(";"):
            if len(tag.split("=")) == 2:
                name,value = tag.split("=")
                if name == "STRANDS":
                    # Lumpy files can have multiple sets of strands for the same variant, we take these apart so ++ and +- versions of a variant each get their own line
                    strand_info = value.split(",")
                    for num in strand_info:
                        strand1 = num[0]
                        strand2 = num[1]
                        num_reads = int(num[3:])
                        fields[8] = strand1
                        fields[9] = strand2
                        fields[11] = num_reads
                        if overwrite_ID_names:
                            fields[6] = ID_counter
                        else:
                            fields[6] = ID_field + strand1 + strand2 # add strands to make the variants unique after splitting a variant into multiple lines with different strands
                        fields_to_output = fields[0:12]
                        ID_counter += 1
                        fout.write(",".join(map(str,fields_to_output)) + "\n")
    f.close()
    fout.close()


def main():
    parser=argparse.ArgumentParser(description="Standardize variant bedpe file to fit for SplitThreader input")
    parser.add_argument("-bedpe",help="Variant calls in bedpe format",dest="bedpe",required=True)
    parser.add_argument("-out",help="Output filename",dest="out",required=True)
    parser.set_defaults(func=run)
    args=parser.parse_args()
    args.func(args)

if __name__=="__main__":
    main()

