#! /usr/bin/env python
import argparse
import gzip

# the standard .isdigit() does not work for negative numbers
# and sometimes alternative chromosomes in Lumpy will have an interval that extends to -1

def is_digit(number):
    try:
        float(number)
        return True
    except ValueError:
        return False

def get_size(fields_to_output):
    if fields_to_output[0] != fields_to_output[3]:
        return -1
    else:
        return abs((int(fields_to_output[1])+int(fields_to_output[2]))/2-(int(fields_to_output[4])+int(fields_to_output[5]))/2)

def filter_variant(fields_to_output, args):
    if fields_to_output[0] == fields_to_output[3]:
        if abs((int(fields_to_output[1])+int(fields_to_output[2]))/2-(int(fields_to_output[4])+int(fields_to_output[5]))/2) >= args.min_size:
            return True
        else:
            return False
    else:
        # interchromosomal
        return True

def run(args):

    is_vcf_file = False
    is_csv_file = False
    is_a_lumpy_file = True
    contains_possible_numreads_column = True

    ID_names = set()

    line_counter = 0

    is_gzipped = False
    
    f = open(args.input)
    header = f.readline()
    # If file is gzipped, close it and open using gzip
    # if header[0:4]=="\x1f\x8b\x08\x08":
    if header[0:2]=="\x1f\x8b":
        # print "Variant file is gzipped"
        f.close()
        is_gzipped = True
        f = gzip.open(args.input)
    else:
        # print "Variant file is not gzipped"
        if "chrom1,start1,stop1,chrom2,start2,stop2,variant_name" in header:
            is_csv_file = True
        f.close()
        f = open(args.input)
    
    if is_csv_file:
        f.readline()


    header_count = 0

    for line in f:
        if line[0] == "#":
            header_count += 1
            if line.find("VCF") != -1:
                is_vcf_file = True
                print "NOTE: Contains 'VCF' in a header row (starting with #), so treating it like a VCF file."
            continue
        fields = line.strip().split()
        if is_csv_file:
            fields = line.strip().split(",")

        # For both VCF and bedpe files:

        # fields[1] is a position, check it's a number
        if not is_digit(fields[1]):
            header_count += 1
            if header_count > 1:
                print "ERROR: Column 2 must be a genomic position, but it is not a number:", fields[1]
                print line
                return
            continue

        if is_vcf_file: # For VCF files only
            ID_names.add(fields[2])
        else:
            # For bedpe files only:
            if len(fields) < 10:
                print "ERROR: Variant file (except vcf) must have at least 10 columns, check the BEDPE format specifications for details"
                return

            # fields[0] is a chromosome name

            # fields[2] is a position, check it's a number
            
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

            # fields[11] can be num_reads
           
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
        print "NOTE: IDs are not unique, replacing with numbers"

    if is_csv_file:
        print "CSV file"
        parse_csv_file(args,overwrite_ID_names=overwrite_ID_names,is_gzipped = is_gzipped)
    elif is_vcf_file:
        print "VCF file"
        clean_vcf(args,overwrite_ID_names=overwrite_ID_names,is_gzipped = is_gzipped)
    elif is_a_lumpy_file:
        print "Lumpy bedpe file"
        clean_lumpy(args,overwrite_ID_names=overwrite_ID_names, is_gzipped = is_gzipped)
    else:
        print "Sniffles bedpe file"
        clean_sniffles(args,overwrite_ID_names=overwrite_ID_names, is_gzipped = is_gzipped)

def remove_chr(chromosome):
    if chromosome[0:3] in ["chr","Chr","CHR"]:
        chromosome = chromosome[3:]
    return chromosome

def parse_csv_file(args,overwrite_ID_names,is_gzipped):
    f = None
    if is_gzipped == True:
        f = gzip.open(args.input)
    else:
        f = open(args.input)

    fout = open(args.out,"w")

    fout.write(f.readline())

    filtered_count = 0
    ID_counter = 1
    for line in f:
        fields = line.strip().split(",")
        fields[0] = remove_chr(fields[0])
        fields[3] = remove_chr(fields[3])
        if overwrite_ID_names:
            fields[6] = ID_counter
        ID_counter += 1
        fields_to_output = fields#[0:12]
        if filter_variant(fields_to_output, args) == True or fields[10] == "INVDUP":
            ID_counter += 1
            if args.output_bedpe == False:
                fout.write(",".join(map(str,fields_to_output)) + "\n")
            else:
                fout.write("\t".join(map(str,fields_to_output)) + "\n")
        else:
            filtered_count += 1
    f.close()
    fout.close()

    print "Number of variants filtered out due to small size (minimum size is", str(args.min_size) + "):", filtered_count


def clean_sniffles(args,overwrite_ID_names,is_gzipped = False):
    f = None
    if is_gzipped == True:
        f = gzip.open(args.input)
    else:
        f = open(args.input)

    fout = open(args.out,"w")
    if args.output_bedpe == False:
        fout.write("chrom1,start1,stop1,chrom2,start2,stop2,variant_name,score,strand1,strand2,variant_type,split\n")
    
    filtered_count = 0
    ID_counter = 1
    for line in f:
        if line[0] == "#":
            continue
        fields = line.strip().split()
        fields[0] = remove_chr(fields[0])
        fields[1] = int(float(fields[1]))
        fields[2] = int(float(fields[2]))
        fields[3] = remove_chr(fields[3])
        fields[4] = int(float(fields[4]))
        fields[5] = int(float(fields[5]))
        if overwrite_ID_names:
            fields[6] = ID_counter
        ID_counter += 1
        if len(fields) == 11:
            fields.append("-1")

        fields_to_output = fields[0:12]

        if filter_variant(fields_to_output, args) == True or fields[10] == "INVDUP":
            ID_counter += 1
            if args.output_bedpe == False:
                fout.write(",".join(map(str,fields_to_output)) + "\n")
            else:
                fout.write("\t".join(map(str,fields_to_output)) + "\n")
        else:
            filtered_count += 1
    f.close()
    fout.close()

    print "Number of variants filtered out due to small size (minimum size is", str(args.min_size) + "):", filtered_count


def clean_lumpy(args,overwrite_ID_names, is_gzipped = False):
    
    f = None
    if is_gzipped == True:
        f = gzip.open(args.input)
    else:
        f = open(args.input)

    fout = open(args.out,"w")

    if args.output_bedpe == False:
        fout.write("chrom1,start1,stop1,chrom2,start2,stop2,variant_name,score,strand1,strand2,variant_type,other_read_support\n")

    filtered_count = 0
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
                        if len(num) > 2:
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
                        if filter_variant(fields_to_output, args) == True or fields[10] == "INVDUP":
                            ID_counter += 1
                            if args.output_bedpe == False:
                                fout.write(",".join(map(str,fields_to_output)) + "\n")
                            else:
                                fout.write("\t".join(map(str,fields_to_output)) + "\n")
                        else:
                            filtered_count += 1
    f.close()
    fout.close()

    print "Number of variants filtered out due to small size (minimum size is", str(args.min_size) + "):", filtered_count


def clean_vcf(args,overwrite_ID_names, is_gzipped = False):
    
    f = None
    if is_gzipped == True:
        f = gzip.open(args.input)
    else:
        f = open(args.input)

    fout = open(args.out,"w")

    if args.output_bedpe == False:
        fout.write("chrom1,start1,stop1,chrom2,start2,stop2,variant_name,score,strand1,strand2,variant_type,split,pairs,other_read_support,size\n")

    variant_type_list = set()
    ID_counter = 1
    strand_fail_list = []

    filtered_count = 0

    file_is_lumpy = False
    for line in f:
        if line[0] == "#":
            if line.find("source=LUMPY") != -1:
                file_is_lumpy = True
            continue
        fields = line.strip().split()

        info_fields = fields[7].split(";")

        chrom1 = remove_chr(fields[0])
        start1 = int(fields[1])
        stop1 = start1 + 1

        chrom2 = chrom1
        start2 = stop2 = 0
        
        ID_field = fields[2]

        if file_is_lumpy == True:
            # Lumpy VCF files end variant names in _1 and _2 to separate out the two breakpoints, so since we are using a bedpe style format, we consolidate the two breakpoints into a single entry
            if ID_field[-2:] == "_2":
                # print "Ignoring", ID_field
                continue
            elif ID_field[-2:] == "_1":
                ID_field = ID_field[:-2]
                # Cut off _1 suffix

        strand1 = ""
        strand2 = ""
        variant_type = fields[4]
        strand_info = None
        numreads_from_STRANDS_tag = -1
        numreads_from_SR_tag = -1
        numreads_from_RE_tag = -1 # In Sniffles means split reads
        numreads_from_PE_tag = -1
        numreads_from_BND_DEPTH_tag = -1
        num_evidence_from_SUPP_tag = -1
        special_inversion_flag = None
        special_CT_strand_code = None
        SVLEN = -1
        
        if fields[4].find("]") != -1 or fields[4].find("[") != -1:
            if fields[4].find("]") != -1 and fields[4].find("[") != -1:
                print "WARNING: Incorrect breakend notation in ALT field:", fields[4]
                # continue
            # print "_________________________________"
            # print fields[4]


            # Find index of first bracket

            strand2 = "-"
            if fields[4].find("]") != -1:
                strand2 = "+"


            start_bracket_index = fields[4].find("[")
            end_bracket_index = fields[4].find("]")

            bracket1 = end_bracket_index
            if bracket1 == -1:
                bracket1 = start_bracket_index
            elif start_bracket_index != -1 and start_bracket_index < end_bracket_index:
                bracket1 = start_bracket_index


            
            # Find index of second bracket
            bracket2 = fields[4][bracket1+1:].find("]")
            if bracket2 == -1:
                bracket2 = fields[4][bracket1+1:].find("[")
            bracket2 += bracket1 + 1

            # print bracket1,bracket2
            remainder = fields[4][bracket1+1:bracket2]
            # print remainder
            
            if bracket1 == 0:
                strand1 = "-"
            elif bracket2 == len(fields[4])-1:
                strand1 = "+"
            else:
                print "WARNING: Incorrect breakend notation in ALT field:", fields[4]


            chrom2 = remove_chr(remainder.split(":")[0])
            start2 = int(remainder.split(":")[1])

        for field in info_fields:
            if len(field.split("=")) == 2:
                name,value = field.split("=")
                if name == "CHR2":
                    chrom2 = remove_chr(value)
                if name == "END":
                    start2 = int(value)
                if name == "STRANDS":
                    strand_info = value
                if name == "SVTYPE":
                    variant_type = value
                if name == "SR":
                    numreads_from_SR_tag = value
                if name == "PE":
                    numreads_from_PE_tag = value
                if name == "RE":
                    numreads_from_RE_tag = value
                if name == "BND_DEPTH":
                    numreads_from_BND_DEPTH_tag = value
                if name == "SUPP":
                    num_evidence_from_SUPP_tag = value
                if name == "CT":
                    special_CT_strand_code = value
                if name == "SVLEN" and is_digit(value):
                    SVLEN = int(value)
            else:
                if field == "INV3":
                    special_inversion_flag = "INV3"
                elif field == "INV5":
                    special_inversion_flag = "INV5"

        if chrom1 != chrom2:
            SVLEN = -1
        stop2 = start2 + 1
        variant_type_list.add(variant_type)
        num_split_reads = -1
        if numreads_from_SR_tag != -1:
            num_split_reads = numreads_from_SR_tag
        elif numreads_from_RE_tag != -1:
            num_split_reads = numreads_from_RE_tag
        
        other_read_support = -1
        if numreads_from_BND_DEPTH_tag != -1:
            other_read_support = numreads_from_BND_DEPTH_tag
        elif num_evidence_from_SUPP_tag != -1:
            other_read_support = num_evidence_from_SUPP_tag
        
        num_discordant_pairs = -1
        if numreads_from_PE_tag != -1:
            num_discordant_pairs = numreads_from_PE_tag



        if strand_info != None:
            strand_info_list = []
            while strand_info[3:].find(":") != -1:
                num = strand_info[0:strand_info[3:].find(":")+1]
                if num[-1] == ",":
                    num = num[0:-1]
                strand_info_list.append(num)
                strand_info = strand_info[strand_info[3:].find(":")+1:]

            strand_info_list.append(strand_info)

            # print strand_info_list

            for num in strand_info_list:
                if strand1 == "" or len(strand_info_list)>1:
                    strand1 = num[0]
                elif strand1 == num[0]:
                    # print "strand1 okay"
                    pass
                else:
                    strand1 = num[0]
                    print "WARNING: strand1 not matching between ALT bracket notation and STRANDS tag in INFO field. STRANDS tag takes precedent"
                    print "STRANDS tag:", strand_info_list, "vs ALT text:", fields[4]

                
                if strand2 == "" or len(strand_info_list)>1:
                    strand2 = num[1]
                elif strand2 == num[1]:
                    # print "strand2 okay"
                    pass
                else:
                    strand2 = num[1]
                    print "WARNING: strand2 not matching between ALT bracket notation and STRANDS tag in INFO field. STRANDS tag takes precedent"
                    print "STRANDS tag:", strand_info_list, "vs ALT text:", fields[4]

                if len(num) > 2:
                    numreads_from_STRANDS_tag = int(num[3:])

                
                if numreads_from_STRANDS_tag != -1:
                    other_read_support = numreads_from_STRANDS_tag
                    # if different strands exist, then we are separating them so we have to use only the STRANDS field for the number of reads to get them separated properly
                    if len(strand_info_list)>1:
                        num_discordant_pairs = -1 # clear both PE and SR because they are aggregated for multiple strands and no longer accurate
                        num_split_reads = -1

                if overwrite_ID_names:
                    ID_field = ID_counter

                new_ID = ID_field
                if len(strand_info_list) > 1:
                    new_ID = ID_field + strand1 + strand2 # add strands to make the variants unique after splitting a variant into multiple lines with different strands

                fields_to_output = [chrom1,start1,stop1,chrom2,start2,stop2,new_ID,0,strand1,strand2,variant_type,num_split_reads,num_discordant_pairs,other_read_support]
                if SVLEN == -1:
                    SVLEN = get_size(fields_to_output)
                fields_to_output.append(SVLEN)
                if args.print_info == True:
                    fields_to_output.append(fields[7])
                
                if filter_variant(fields_to_output, args) == True or variant_type == "INVDUP":
                    ID_counter += 1
                    if args.output_bedpe == False:
                        fout.write(",".join(map(str,fields_to_output)) + "\n")
                    else:
                        fout.write("\t".join(map(str,fields_to_output)) + "\n")
                else:
                    filtered_count += 1
        else:
            if strand1 == "" and strand2 == "":
                if special_CT_strand_code != None:
                    if special_CT_strand_code[0] == "5":
                        strand1 = "-"
                    else:
                        strand1 = "+"
                    if special_CT_strand_code[-1] == "5":
                        strand2 = "-"
                    else:
                        strand2 = "+"
                else:
                    if variant_type == "DEL":
                        strand1 = "+"
                        strand2 = "-"
                    elif variant_type == "DUP":
                        strand1 = "-"
                        strand2 = "+"
                    elif variant_type == "INS":
                        strand1 = "+"
                        strand2 = "-"
                    elif variant_type == "INV" and special_inversion_flag != None:
                        if special_inversion_flag == "INV3":
                            strand1 = strand2 = "+"
                        elif special_inversion_flag == "INV5":
                            strand1 = strand2 = "-"
                    else:
                        strand_fail_list.append(line.strip())
                        
            if overwrite_ID_names:
                ID_field = ID_counter


            fields_to_output = [chrom1,start1,stop1,chrom2,start2,stop2,ID_field,0,strand1,strand2,variant_type,num_split_reads,num_discordant_pairs,other_read_support]
            if SVLEN == -1:
                SVLEN = get_size(fields_to_output)
            fields_to_output.append(SVLEN)

            if args.print_info == True:
                fields_to_output.append(fields[7])

            if filter_variant(fields_to_output, args) == True or variant_type == "INVDUP":
                ID_counter += 1
                if args.output_bedpe == False:
                    fout.write(",".join(map(str,fields_to_output)) + "\n")
                else:
                    fout.write("\t".join(map(str,fields_to_output)) + "\n")
            else:
                filtered_count += 1

    if len(strand_fail_list) > 0:
        print "WARNING: No strand info for records. Variants will be ignored by visualizer:"
        for i in xrange(min(5,len(strand_fail_list))):
            print strand_fail_list[i]
        print "Total variants affected:", len(strand_fail_list), " out of " , ID_counter , " total variants"
        print "You can specify strands among the other tags in the vcf file's info field, for example: STRANDS=+-:5; where 5 is the number of split reads"
        print "Visualizer will ignore these variants where it could not guess the strands from the variant types"


    print "All variant types:", ", ".join(variant_type_list)
    print "Number of variants filtered out due to small size (minimum size is", str(args.min_size) + "):", filtered_count

def main():
    parser=argparse.ArgumentParser(description="Standardize variant vcf or bedpe file to fit for SplitThreader input")
    parser.add_argument("-input",help="Variant calls in bedpe or vcf format",dest="input",required=True)
    parser.add_argument("-out",help="Output filename",dest="out",required=True)
    parser.add_argument("-min_size",help="Minimum size for variant filter",dest="min_size",default=1000,type=int)
    parser.add_argument("-bedpe",help="Output file in bedpe format with tabs and no header",dest="output_bedpe",action='store_true')
    parser.add_argument("-info",help="Print entire info field in last column",dest="print_info",action='store_true')
    parser.set_defaults(func=run)
    args=parser.parse_args()
    args.func(args)

if __name__=="__main__":
    main()

