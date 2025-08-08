1 - Make the CSV uploads more user friendly. Allow users to upload the CSV files and bulk and let them select from a dropdown what kind of table it is. There should also be internal logic to help auto select the best table name. the csv file name format is typically report-{product}-{tableType}.csv (ex: report-addressabledisplay-performance-by-zip.csv). 
- Example use case: Bulk uploads the following csvs with these names:
	- report-addressabledisplay-creative-by-name.csv
	- report-addressabledisplay-performance-by-city.csv
	- report-addressabledisplay-performance-by-zip.csv
	- report-meta-monthly-performance (1).csv
	- report-meta-performance-by-platform (1).csv
	- report-meta-facebook-ads-performance (1).csv
- Files auto sort to respective product sections and Logic also detects which table the csvs are relevant to, example:
	- Addressable Display: Creative By Name, Performance By City, Performance By Zip Code
	- Meta: Monthly Performance, Performance By Platform, Facebook Ads Performance
	- ** Handles csvs names with (1), or (2), (3) etc..
- Logic in the upload fields detect Table Type and auto selects from the drop down, user can edit if it's incorrect
- If the sort can't be determined, leave unsorted and enable another dropdown within the file name that will let users select the right tactic (options should be only products that were pulled from initial lumina request) (Or drag/drop which ever one creates the LEAST issues)
- Users can use a section to bulk drop CSVs, or bulk drop CSVs in individual product sections
2 - Too many product data upload sections are generating, looks like the JSON response is being misread or I wasnt being clear. The only tables that should appear are the relevant "Products" and SubProduct in the title if so if a lumina link is pulled and it Has Blended Tactics with Targeted Display and AAT,KWT subproducts, the table upload section name should be Blended Tactics: Targeted Display - AAT,KWD or if its Meta with Facebook Link Clicks sub products it should be Meta: Facebook - Link Clicks or if its Email Marketing with 1:1 Marketing subproduct, it should be "Email Marketing: 1:1 Marketing". "AAT" or "1:1 Marketing" should not have their own data upload sections 