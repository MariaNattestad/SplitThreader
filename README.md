# SplitThreader

SplitThreader is an interactive web application for analysis of rearrangements in a cancer genome. 

SplitThreader is available online at [http://splitthreader.com](http://splitthreader.com). 


![SplitThreader screenshot](/images/screenshot1.png)
![SplitThreader screenshot](/images/screenshot2.png)

## Local deployment
If you need to deploy SplitThreader locally, here are the steps:

1. Install XAMPP on your computer (includes Apache and PHP)
2. Using the Terminal, go to the htdocs folder created during the install. On a Mac, the folder is located at /Applications/XAMPP/htdocs/

   ```
   cd /Applications/XAMPP/htdocs/
   ```

3. Clone this repository into the htdocs folder

   ```
   git clone https://github.com/marianattestad/splitthreader
   ```

4. Then go to a web browser such as Chrome, Firefox, or Safari (Not tested on IE) and type into the url box:

   ```
   localhost/splitthreader
   ```

5. You may have to change the Python path for apache in order to be able to run SplitThreader
