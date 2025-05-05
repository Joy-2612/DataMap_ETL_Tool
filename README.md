**Usage**

### **Server Setup**

**Step 1:** Navigate...
**Step 2:** Create .env

Then sections under "Client" that are similarly formatted. Each section will include clear subheadings, like "**Environment Variables**" under "Server" and "**Setup**" under "Client".

Thought for a few seconds

**Usage**

---

### **Server**

#### **1. Navigate to the server folder**

```bash
cd server
```

#### **2. Create the `.env` file**

In `server/.env`, add:

```ini
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=HelloWorld
PORT=5000
GEMINI_API_KEY=<your Gemini API key>
```

#### **3. Install dependencies**

```bash
npm install
```

#### **4. Start the server**

```bash
npm start
```

The API will be running at **[http://localhost:5000](http://localhost:5000)**.

---

### **Client**

#### **1. Navigate to the client folder**

```bash
cd client
```

#### **2. Install dependencies**

```bash
npm install
```

#### **3. Start the development server**

```bash
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)** to view the React app.
