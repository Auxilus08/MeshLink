FROM node:20-bookworm

# Install required dependencies for Electron and X11 forwarding
RUN apt-get update && apt-get install -y \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libgbm1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxss1 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxfixes3 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    libxtst6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Required so Electron can boot inside a container
ENV ELECTRON_DISABLE_SANDBOX=1

# By default, start the development server
# If you want production, you can change this to run the compiled out/
CMD ["npm", "run", "dev"]
