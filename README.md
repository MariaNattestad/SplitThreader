# SplitThreader

SplitThreader is an interactive web application for analysis of rearrangements in a cancer genome. 

SplitThreader is available online at [http://splitthreader.com](http://splitthreader.com). 

## Screenshots:
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
4. Open up permissions for user_data and user_uploads so new files can be created in those directories

   ```
   chmod 777 user_uploads
   chmod 777 user_data
   ```

5. Then go to a web browser such as Chrome, Firefox, or Safari (Not tested on IE) and type into the url box:

   ```
   localhost/splitthreader
   ```

6. You may have to change the Python path for apache in order to be able to run SplitThreader
