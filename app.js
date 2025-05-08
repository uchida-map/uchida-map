body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

header {
  background-color: #333;
  color: white;
  padding: 10px 0;
  text-align: center;
}

header h1 {
  margin: 0;
}

nav ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

nav li {
  display: inline;
  margin: 0 15px;
}

nav a {
  color: white;
  text-decoration: none;
}

#photo-upload {
  text-align: center;
  margin: 20px 0;
}

#gallery {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

#gallery img {
  max-width: 150px;
  max-height: 150px;
  border: 2px solid #ccc;
  cursor: pointer;
  border-radius: 5px;
}

#map {
  height: 500px;
  width: 100%;
  margin-bottom: 20px;
}

footer {
  text-align: center;
  padding: 10px;
  background-color: #333;
  color: white;
}
