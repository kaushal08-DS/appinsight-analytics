# Supplied dataset audit

File: `data/raw/googleplaystore.csv`
Rows: 10,841
Columns: 13

Columns:
App, Category, Rating, Reviews, Size, Installs, Type, Price, Content Rating, Genres, Last Updated, Current Ver, Android Ver

Exact duplicate rows: 483
Missing Rating values: 1,474
Required categories before numeric filters: 2,846 rows
After Rating > 3.5: 2,290
After Installs > 50,000: 1,759
After Reviews > 500: 1,745
After Size 10–100 MB: 1,062

Subjectivity: unavailable in supplied data. No review text or subjectivity field is present.
