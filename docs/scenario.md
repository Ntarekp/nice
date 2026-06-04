1.	Integrated Situation:
TWZ LTD is a company dedicated to managing, inspecting, and maintaining fire safety equipment, particularly fire extinguishers, across various large commercial and industrial facilities in the region. Currently, there Fire Extinguishers Management System is built using a Monolithic Architecture but is facing several challenges, including missed inspections deadlines, difficulties in tracking maintenance history, and compliance issues. To enhance efficiency and functionality, TWZ LTD seeks to upgrade their system to a Microservices architecture. This new system will allow users to check extinguishers statuses, schedule inspections, log maintenance actions, track compliance, and generate real-time reports.
Task:
As a Full Stack Developer, you have been hired to analyse, design, and implement a Fire Extinguisher Management System based on RESTful microservices, ensuring scalability, maintainability, and high availability.
Activities:
Activity 1: Requirement Analysis and Design
1.	Design and define the required microservices and RESTful API contract using OpenAI/Swagger documentation
2.	Define and design the database Model
3.	Design Mock-up for user registration/signup form using Figma or other tools
Activity 2: User management services
a). Define user roles(Admin, Inspector and User)
	-Admin: Manages overall system features, user accounts, and data integrity.
	-Inspector: Responsible for conducting Inspections, logging results, and scheduling maintenance.
	-User: Can view extinguisher status and schedule inspections. Create user experience
b). Implement User Registration Endpoint:

Create an API for new users to register, receiving and validating the following:
•	Create an API for new users to register, receiving and validating the following:
•	First Name
•	Last Name
•	Email
•	Password
c. Implement Authentication Endpoint and apply JWT-based authentication and role-based authorization: Develop an API for user login and logout, managing sessions or tokens securely.

d. Develop user profile management (update their profile, change their passwords, and recover their passwords).

Activity 3: Fire Extinguishers Management Services
a.	Create endpoints to Register new extinguishers with below records:
-	Serial Number
-	Location
-	Type (Water, CO2, Foam, Dry Chemical)
-	Size (2,5lbs., 5lbs., 9lbs, 12 lb.,)
-	Installation Date
-	Expiry date
-	Status
b.	Create endpoints to list all extinguishers
c.	Create endpoints to View extinguishers details by id
d.	Create endpoints to update extinguisher information
e.	Create endpoints to Remove extinguisher record
f.	Develop an API to allow users to schedule inspections, which includes:
-	Selecting the extinguisher
-	Choose a date and time
-	Notify relevant personnel
g.	Implement an API for inspectors to log maintenance activities, including:
-	Actions taken
-	Date of the actions
-	Conditions noted during the maintenance
Activity 4: Reporting Services
-	Generates real-time reports:
-	Total number of extinguishers in the stock (daily, monthly, yearly)
-	Inspection status
-	Expired extinguishers
-	Maintenance history
Activity 5: API Testing and Deployment
1.	The RESTful APIs and document them
2.	Export database and push it to the provided repository
3.	Export report in PDF and CSV format
4.	The project is handed over to the provided repository
Instructions:
1.	You should design the mock-up of this system using Figma
2.	You should build frontend using (React library or any other framework) that consumes the Restful APIs.
3.	You should build backend using JavaScript framework
4.	User signup and login should be performed using the frontend developed.
5.	Use PostgreSQL as your DBMS.
6.	Open your backend APIs with Swagger UI.
7.	You should use JWT in authorization and authentication
8.	Ensure all records are displayed in a paginated manner
9.	Display logs properly
10.	Handle CORS and any other common web security attacks properly.
11.	Good looking and responsive systems wins more points.
