#! /usr/bin/env python
import argparse
import gzip

def run(args):


    f = open(args.csv)
    header = f.readline()
    # If file is gzipped, close it and open using gzip, then reread the header
    if header[0:4]=="\x1f\x8b\x08\x08":
        f.close()
        f = gzip.open(args.csv)
        header = f.readline().strip()

    column_index = {}
    delim = ","
    header_fields = header.split(",")
    if len(header_fields)<4 and len(header.split()) >= 4:
        print "NOTE: Found not enough comma-separated column names in header: treating file as whitespace delimited instead"
        delim = "whitespace"
        header_fields = header.split()
    
    if len(header_fields) < 4:
        print "ERROR: Copy number file needs at least 4 columns named: chromosome,start,end,coverage"
        print header_fields
        print header

        return

    for i in xrange(len(header_fields)):
        name = header_fields[i]
        if name in ["chromosome","chrom"]:
            if column_index.get("chromosome",None) == None:
                column_index["chromosome"] = i
            else:
                print "ERROR: multiple columns named chromosome/chrom. Copy number file must only have 1"
                return
        if name in ["start","beg","beginning","begin"]:
            if column_index.get("start",None) == None:
                column_index["start"] = i
            else:
                print "ERROR: multiple columns named start/beg/begin/beginning. Copy number file must only have 1"
                return
        if name in ["stop","end"]:
            if column_index.get("end",None) == None:
                column_index["end"] = i
            else:
                print "ERROR: multiple columns named stop/end. Copy number file must only have 1"
                return
        if name.find("copy") > -1 or name.find("cov") > -1:
            if column_index.get("coverage",None) == None:
                column_index["coverage"] = i
            else:
                print "ERROR: multiple columns containing cov/coverage/copy related substring. Copy number file must only have 1"
                return

    for name in ["chromosome","start","end","coverage"]:
        if column_index.get(name,None) == None:
            print "ERROR: header must include", name
            return

    # Start writing new coverage file
    fout = open(args.out,'w')
    chromosome_size_dict = {}
    chromosomes_in_order = []

    fout.write("chromosome,start,end,coverage\n")
    for line in f:
        fields = line.strip().split(delim)
        if delim == "whitespace":
            fields = line.strip().split()
        
        new_fields = []
        new_fields.append(remove_chr(fields[column_index["chromosome"]]))
        for name in ["start","end","coverage"]:
            new_fields.append(fields[column_index[name]])

        if chromosome_size_dict.get(new_fields[0],0) < int(new_fields[2]):
            chromosome_size_dict[new_fields[0]] = int(new_fields[2])
        
        if new_fields[0] not in chromosomes_in_order:
            chromosomes_in_order.append(new_fields[0])
        fout.write(",".join(new_fields)+"\n")
    f.close()
    fout.close()

    # Write genome file: chromosome, size
    fgenome = open(args.genome_out,'w')
    fgenome.write("chromosome,size\n")
    for chrom in chromosomes_in_order:
        fgenome.write("%s,%d\n" % (chrom,chromosome_size_dict[chrom]))
    fgenome.close()

def remove_chr(chromosome):
    if chromosome[0:3] in ["chr","Chr","CHR"]:
        return chromosome[3:]
    else:
        return chromosome

def main():
    parser=argparse.ArgumentParser(description="Standardize copy number file format to fit for SplitThreader input")
    parser.add_argument("-csv",help="copy number profile in .csv format",dest="csv",required=True)
    parser.add_argument("-out",help="Output filename",dest="out",required=True)
    parser.add_argument("-genome_out",help="Genome size output filename",dest="genome_out",required=True)
    parser.set_defaults(func=run)
    args=parser.parse_args()
    args.func(args)

if __name__=="__main__":
    main()

