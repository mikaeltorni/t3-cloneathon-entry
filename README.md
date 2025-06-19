# INSTRUCTIONS

Tested using Windows PowerShell

1. Open your favorite terminal and change directory as desired

2. run
```
git clone https://github.com/mikaeltorni/t3-cloneathon-entry
cd t3-cloneathon-entry
npm install
cd web-app
npm install
cd ..
```

3. There's an env.template file located at the root of the project. Lets make a copy out of it and name it .env:
```
cp env.template .env
```

The .env file is in the .gitignore by default

4. Open the .env file in your favorite editor.

5. Head on to over https://openrouter.ai/settings/keys and press the Create API Key button

6. Enter it a name, e.g: VibeChat

7. Credit limit is optional but HIGHLY RECOMMENDED

8. Click Create

9. Copy the key and enter it to your .env file's OPENROUTER_API_KEY variable

10. You don't need to edit PORT and RATE_LIMIT_PER_MINUTE

11. Next up, lets setup the Firebase configuration

12. Head on to https://console.firebase.google.com/u/0/

13. Create new project

14. Give it a name. We'll call it t3-cloneathon-testing

15. You can Enable Gemini in firebase if you want.

16. Analytics are not needed

17. Press continue, the project will configure now.

18. Once it's ready, press continue.

NOTE THAT WE RECOMMEND TO USE THE SPARK PLAN FOR THIS PROJECT, INSTEAD OF THE BLAZE PLAN!

19. Now you are at: https://console.firebase.google.com/u/0/project/t3-cloneathon-testing/overview

20. Set up a web app right of the iOS and Android icons.

21. Name it VibeChat, or such.

22. No need to check the Firebase Hosting

23. Click Register app.

24. Details will show up copy them to details.txt file on your desktop. Then press continue.

26. Copy the apiKey from the details.txt file. Insert it to FIREBASE_API_KEY in the .env file

27. copy the auth domain from the details file. Insert it to FIREBASE_AUTH_DOMAIN environment variable

28. Copy the storageBucket from the details.txt file and insert it to FIREBASE_STORAGE_BUCKET variable

29. Copy the messagingSenderId from the file and insert it to the FIREBASE_MESSAGING_SENDER_ID variable

30. Copy the appId and insert it to FIREBASE_APP_ID

31. Head on to the Project settings and General: https://console.firebase.google.com/u/0/project/t3-cloneathon-testing/settings/general

32. Head on to Authentication tab. https://console.firebase.google.com/u/0/project/t3-cloneathon-testing/authentication

33. Click Get started you will end up at https://console.firebase.google.com/u/0/project/t3-cloneathon-testing/authentication/providers

34. Set up Google as "Additional provider"

35. Set up, or use the default public facing name for the project. We will use vibin-81293812938129

36. Set up your email as the Support email for the project.

37. Leave other dropdown menu fields blank

38. Click save

39. Head on to the Project Settings -> Service account https://console.firebase.google.com/u/0/project/t3-cloneathon-testing/settings/serviceaccounts/adminsdk

40. Generate new private key. 

41. File will download. Open it a editor.

42. Open up the .env file again.

43. Add project_id in the json file (t3-cloneathon-testing) to PROJECT_ID .env variable too.

44. Fill in the FIREBASE_AUTH_DOMAIN with your project name, in this case it will be: t3-cloneathon-testing.firebaseapp.com 

45. Enter private_key to FIREBASE_PRIVATE_KEY (with quotes)

46. Add client_email to FIREBASE_CLIENT_EMAIL

47. Head on to Project shortcuts on the left

48. Click Firestore Database

49. Click on Create database

50. Set up a region for it. Press Next.

51. On the Secure rules page, select Start in Production mode 

52. Head on to the Rules tab.

53. Copypaste the rules from firebase_config\firestore.rules to this tab

The server is now ready for local debugging, run:
```
npm run dev build
```

54. The server will start now. Open localhost:5173 with your favorite browser, and enjoy testing!

If you run in to any issues error the node server setup, kill all node processes, or cmd instances that might have had the server running, perhaps reboot your computer if you can't fix it with these.

MAKE SURE THAT YOUR ENV FILE IS CLEAR OF SYNTAX ERRORS! Small extra comma or quote can make it non functional. Follow the template.

For Vercel/Railway deployment you will need to allow the domain from the Google Firebase Console + setup the PRODUCTION_ORIGINS and VITE_API_BASE_URL variables, otherwise it won't work.
