-- Authors table
CREATE TABLE IF NOT EXISTS q_authors (
    authorId INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50),
    lastName VARCHAR(50),
    dob DATE,
    sex CHAR(1)
);

-- Quotes table
CREATE TABLE IF NOT EXISTS q_quotes (
    quoteId INT AUTO_INCREMENT PRIMARY KEY,
    quote TEXT,
    category VARCHAR(50),
    authorId INT,
    FOREIGN KEY (authorId) REFERENCES q_authors(authorId)
);