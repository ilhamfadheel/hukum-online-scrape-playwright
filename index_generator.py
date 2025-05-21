import os

# Replace with your GCS bucket name
bucket_name = 'uu-indo-fixed'

# Replace with the path to your local directory containing the PDFs
local_directory = 'output/uu'

# Output HTML file
output_file = 'index.html'

# Start writing the HTML content
html_content = '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PDF Index</title>
</head>
<body>
    <h1>List of PDFs</h1>
    <ul>
'''

# Iterate over all PDF files in the local directory
for filename in os.listdir(local_directory):
    if filename.endswith('.pdf'):
        file_url = f'https://storage.googleapis.com/{bucket_name}/uu/{filename}'
        html_content += f'        <li><a href="{file_url}">{filename}</a></li>\n'

# Close the HTML tags
html_content += '''    </ul>
</body>
</html>
'''

# Write the HTML content to the output file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f'index.html has been created with links to your PDFs.')
