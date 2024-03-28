# SplitThreader (ARCHIVED)

NOTE: SplitThreader is archived. It has become technically outdated and hard to maintain in its current form, so we are finally shutting it down (April 2024) after 8 years.

## A brief history and post-mortem of SplitThreader

I wrote SplitThreader to help me analyze the particularly gnarly genome of SKBR3, a breast cancer cell line I studied for my PhD. As of this writing, GitHub says SplitThreader is 8 years old, and we've kept it running somehow on an old web server that whole time.

SplitThreader was my first real visualization tool I made, the first of many, and it taught me a lot about making visualization tools, but I also learned a lot since then about software development and making a good bioinformatics tool. Because of some things I didn't know back then, SplitThreader is now harder and more expensive to maintain than the very next software project I made, [Ribbon](https://genomeribbon.com). SplitThreader was always more niche, visualizing long-range structural variants that are rare in healthy individuals and only really need SplitThreader's level of firepower when there are tons of them in cancer genomes like SKBR3.

Some things I would do differently today if I had bandwidth to give SplitThreader a makeover:

1. Require a pre-analyzed copy number profile instead of doing that processing on the server. Back in 2014-ish when I started SplitThreader, I couldn't find a nice tool that could generate a copy number profile for every 10kb bin in the human genome, so I duct-taped some tools together. To use SplitThreader, users would have to run this [terrible bash script](https://github.com/MariaNattestad/copycat) to get a copy number input file. I think bedtools might have something that can actually bin coverage now across the whole genome, but back when I made SplitThreader it could only output coverage for every single base on its own line, so my bash script was using that and then binning it with `awk`, which took a long time. Then inside the SplitThreader server, it would run some more processing in Python and finally use an R script to segment the copy number data. The way to change SplitThreader for the better today would be to adopt one or more copy number file formats that now are more standardized and have tools to generate them. It would use the input file directly without any extra processing, taking it whether it's segmented or not, and not trying to do any of that for the user. This would be more flexible and remove the need for the server.
2. Make it front-end only. Back-ends cost money and require a bigger server, and they also result in uploading user data which then needs to be secured or at the very least occasionally deleted. SplitThreader and other applications on the old institutional web server would have issues every year or so when the server would fill up (mostly from other more data-heavy applications) and wouldn't take any more uploads. By removing the copy number processing from the server side and similarly moving the VCF wrangling to the front-end, we could completely remove the need for the server. Today we could even use WebAssembly-compiled bedtools and bcftools for this through [biowasm](https://github.com/biowasm/biowasm)! Making SplitThreader front-end-only would also make it much easier for clinical users to install a local version to keep patient data secure.

## An opportunity

If anyone is interested to take this on as a project, please give it a try and let me know how it goes! I think it could be a great project for a budding bioinformatics software engineer.

# Previous README contents:

SplitThreader is an interactive web application for analysis of rearrangements in a cancer genome.

## Screenshots:
![SplitThreader screenshot](/images/screenshot1.png)


![SplitThreader screenshot](/images/screenshot2.png)
