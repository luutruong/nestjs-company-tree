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

