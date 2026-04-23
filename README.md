Student Assignment Manager – Frontend (Member 1)

## 📌 Overview

This project is a *Student Assignment Manager* web application.
As *Member 1, I was responsible for building the **Frontend Authentication and User Dashboard* using *HTML, CSS, and Vanilla JavaScript*.

The frontend allows users to:

* Register an account
* Login securely
* View assigned tasks
* View notifications
* Logout
* Use the system on both desktop and mobile devices

---

# 👩‍💻 My Role – Member 1 (Frontend)

I implemented the following pages:

* Login Page
* Register Page
* Notifications Page
* Mobile Responsive Design

---

# 📂 Pages Implemented

## 1. Login Page

*Features*

* Email input
* Password input (hidden)
* Login button
* Redirect to dashboard after login
* Token stored in localStorage

*API Used*


POST /api/auth/login


---

## 2. Register Page

*Features*

* Name input
* Email input
* Password input
* Register button
* Redirect to login page after registration

*API Used*


POST /api/auth/register


---


## 3. Notifications Page

Displays user notifications.

*Features*

* Task assignment notification
* Comment notification
* Deadline reminder
* Logout button
* Card-style UI

---

# 📱 Mobile Responsive Design

The application supports mobile devices using *CSS Media Queries*.

Mobile improvements:

* Responsive containers
* Full width buttons
* Stacked layout
* Mobile-friendly cards
* Scalable text

A global file responsive.css was used and linked to:

* login.html
* register.html
* dashboard.html
* notifications.html

---

# 🛠 Technologies Used

* HTML
* CSS
* Vanilla JavaScript
* Fetch API
* LocalStorage
* Responsive CSS (Media Queries)

---

# 📁 Project Structure


project/
│
├── login.html
├── register.html
├── dashboard.html
├── notifications.html
│
├── style.css
│
├── login.js
├── register.js
├── dashboard.js
├── notifications.js


---

# 🔐 Authentication Flow

1. User registers
2. User logs in
3. Token saved in localStorage
4. Dashboard checks token
5. Tasks fetched using token
6. User logs out (token removed)

---

# 🚀 How to Run

1. Open project in VS Code
2. Start backend server
3. Open login.html in browser
4. Register new user
5. Login
6. View dashboard tasks

---

# ✨ Features Implemented

* Authentication UI
* Task dashboard
* Notifications UI
* Logout system
* Token handling
* Responsive design
* Clean UI layout
* Dynamic data rendering

---

# 📌 Member 1 Contribution Summary

I developed the frontend authentication system, notifications page, and implemented responsive mobile design using Vanilla JavaScript and REST API integration.
