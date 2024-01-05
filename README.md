## Installation

```sh
yarn install
```

With docker:

```sh
docker-compose build
```

## Running

```sh
yarn run start:dev
```

Note: Without docker you must provide mongodb configuration.


With docker:

```sh
docker-compose up
```


## Configuration

Create new file `.env` in the root directory

```
COMPANY_SEEDING_DATA_API_URL=
COMPANY_TRAVEL_SEEDING_DATA_API_URL=

MONGODB_USER=root
MONGODB_PASSWORD=password
MONGODB_DATABASE=company-tree
```

## Tests

```sh
yarn test:e2e
```

## API

### Get all company tree

```graphql
query {
  companyTree {
    id
    name
    cost
    children {
      id
      name
      cost
      parentId
      children {
        id
        name
        cost
      }
    }
  }
}
```

Example response:

```
{
  "data": {
    "companyTree": [
      {
        "id": "6597a8b58c4bf065b77690d0",
        "name": "Webprovise Corp",
        "cost": 41009,
        "children": [
          {
            "id": "6597a8b58c4bf065b77690d4",
            "name": "Stamm LLC",
            "cost": 3770,
            "parentId": "6597a8b58c4bf065b77690d0",
            "children": [
              {
                "id": "6597a8b58c4bf065b77690dc",
                "name": "Price and Sons",
                "cost": 1340
              },
              {
                "id": "6597a8b58c4bf065b77690e8",
                "name": "Zieme - Mills",
                "cost": 1636
              },
              {
                "id": "6597a8b58c4bf065b7769118",
                "name": "Schneider - Adams",
                "cost": 794
              }
            ]
          },
          {
            "id": "6597a8b58c4bf065b77690d8",
            "name": "Blanda, Langosh and Barton",
            "cost": 11866,
            "parentId": "6597a8b58c4bf065b77690d0",
            "children": [
              {
                "id": "6597a8b58c4bf065b77690e0",
                "name": "Hane - Windler",
                "cost": 1288
              },
              {
                "id": "6597a8b58c4bf065b77690e4",
                "name": "Vandervort - Bechtelar",
                "cost": 2512
              },
              {
                "id": "6597a8b58c4bf065b77690f0",
                "name": "Kuhic - Swift",
                "cost": 3086
              },
              {
                "id": "6597a8b58c4bf065b7769110",
                "name": "Rohan, Mayer and Haley",
                "cost": 4072
              },
              {
                "id": "6597a8b58c4bf065b776911c",
                "name": "Kunde, Armstrong and Hermann",
                "cost": 908
              }
            ]
          },
          {
            "id": "6597a8b58c4bf065b77690ec",
            "name": "Bartell - Mosciski",
            "cost": 23340,
            "parentId": "6597a8b58c4bf065b77690d0",
            "children": [
              {
                "id": "6597a8b58c4bf065b77690f4",
                "name": "Lockman Inc",
                "cost": 4288
              },
              {
                "id": "6597a8b58c4bf065b77690f8",
                "name": "Parker - Shanahan",
                "cost": 9364
              },
              {
                "id": "6597a8b58c4bf065b7769100",
                "name": "Balistreri - Bruen",
                "cost": 1686
              },
              {
                "id": "6597a8b58c4bf065b7769108",
                "name": "Predovic and Sons",
                "cost": 4725
              },
              {
                "id": "6597a8b58c4bf065b776910c",
                "name": "Weissnat - Murazik",
                "cost": 3277
              }
            ]
          },
          {
            "id": "6597a8b58c4bf065b7769114",
            "name": "Walter, Schmidt and Osinski",
            "cost": 2033,
            "parentId": "6597a8b58c4bf065b77690d0",
            "children": []
          }
        ]
      }
    ]
  }
}
```