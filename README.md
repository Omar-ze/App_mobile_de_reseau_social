# Application de chat  - Spring Boot + React Native

 Application mobile de chat avec appels audio/vidéo, développée avec React Native , Spring Boot pour la partie de backend et MySQL. en temps réel.

## Architecture

```
chatapp-project/
├── backend/          # Spring Boot (Java 21) + MySQL
└── mobile/           # Expo React Native (Expo Go compatible)
```

## Pré-requis

- Java 21 (JDK)
- Maven 3.9+
- MySQL 8.0+
- Node.js 18+
- npm ou yarn
- Expo Go sur les deux téléphones (Android ou iOS)

---

## 1. Configurer MySQL

Ouvrez MySQL et créez la base de données :

```sql
CREATE DATABASE chatapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Configurer le backend

Modifiez `backend/src/main/resources/application.properties` :

```properties
spring.datasource.username=votre_utilisateur_mysql
spring.datasource.password=votre_mot_de_passe_mysql
```

Les tables sont créées automatiquement au démarrage (`ddl-auto=update`).

### Lancer le backend

```bash
cd backend
mvn spring-boot:run
```

Le serveur démarre sur http://localhost:8080

---

## 3. Configurer l'app mobile

### ⚠️ IMPORTANT : Adresse IP

Le téléphone ne peut PAS accéder à "localhost" de votre PC.
Vous devez utiliser l'adresse IP locale de votre PC sur le réseau Wi-Fi.

**Trouver votre IP :**
- Windows : `ipconfig` → IPv4 (ex: 192.168.1.10)
- Mac/Linux : `ifconfig` → en0/eth0 (ex: 192.168.1.10)

Modifiez `mobile/lib/api.ts` :

```typescript
export const API_BASE_URL = "http://192.168.1.10:8080";  // ← votre IP ici
```

⚠️ Le téléphone ET le PC doivent être sur le même réseau Wi-Fi.

### Installer les dépendances

```bash
cd mobile
npm install
```

### Lancer l'app Expo

```bash
npx expo start
```

### Scanner le QR code

- **Android** : ouvrez Expo Go → Scan QR code
- **iOS** : ouvrez l'appareil photo → scannez le QR code

Faites cela sur les DEUX téléphones avec deux comptes différents.

---

## 4. Tester les appels vidéo

1. Téléphone A : créer un compte (ex: alice / alice@test.com / password123)
2. Téléphone B : créer un compte (ex: bob / bob@test.com / password123)
3. Téléphone A → onglet Contacts → appuyer sur Bob → 💬 pour ouvrir le chat
4. Dans le chat → appuyer sur 📹 (vidéo) ou 📞 (audio)
5. Téléphone B → une fenêtre "Appel entrant" apparaît → 📹 pour accepter
6. L'appel vidéo démarre entre les deux téléphones !

---

## Comment ça marche

```
Téléphone A                 Serveur Spring Boot            Téléphone B
    |                            |                              |
    |--- call-invite (WS) ------>|                              |
    |                            |--- call-invite (WS) -------->|
    |                            |                              |
    |                            |<-- call-accept (WS) ---------|
    |<-- call-accept (WS) -------|                              |
    |                            |                              |
    |--- webrtc-offer (WS) ----->|                              |
    |                            |--- webrtc-offer (WS) ------->|
    |                            |                              |
    |                            |<-- webrtc-answer (WS) -------|
    |<-- webrtc-answer (WS) -----|                              |
    |                            |                              |
    |<============= VIDEO/AUDIO PEER-TO-PEER =================>|
         (connexion directe entre les deux téléphones)
```

Le serveur Spring Boot ne fait que la **signalisation** (échange d'adresses).
La vidéo et l'audio passent **directement** entre les deux téléphones (WebRTC P2P).

---
