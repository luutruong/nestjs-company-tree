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

With docker:

```sh
docker-compose up
```


## Configuration

Create new file `.env` in the root directory

```
COMPANY_SEEDING_DATA_API_URL=
COMPANY_TRAVEL_SEEDING_DATA_API_URL=
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

