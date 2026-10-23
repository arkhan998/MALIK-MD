# Node.js ki aakhri stable version ko base image ke tor par istemal karein
FROM node:lts-buster

# Bot ke liye zaroori media processing libraries install karein
# Is se sticker banane, video/audio download karne me madad milti hai
RUN apt-get update && \
  apt-get install -y \
  ffmpeg \
  imagemagick \
  webp && \
  apt-get upgrade -y && \
  rm -rf /var/lib/apt/lists/*

# Container ke andar kaam karne ke liye 'app' naam ka folder banayein
WORKDIR /app

# Pehle sirf package files copy karein taake Heroku dependencies ko cache kar sake
COPY package*.json ./

# Saari zaroori node packages (dependencies) install karein
RUN npm install

# Baaki saara code project folder me copy karein
COPY . .

# Port expose karein taake Heroku web process ko detect kar sake
EXPOSE 3000

# Container start hone par bot ko chalaane wali command
CMD ["npm", "start"]
