# Raindrop API Reference

## Authentication

**Header**: `Authorization: Bearer {token}`

Token stored in environment: `RAINDROP_TOKEN`

## Endpoints

### Get Bookmarks from Collection

```
GET https://api.raindrop.io/rest/v1/raindrops/{collection_id}?perpage={count}
```

**Collection IDs**:
- `-1` = Unsorted (default, where untagged bookmarks land)
- `0` = All bookmarks
- Custom collection IDs from `/collections` endpoint

**Parameters**:
- `perpage`: Number of results (max 50)
- `page`: Page number for pagination

### Update Bookmark (Tag)

```
PUT https://api.raindrop.io/rest/v1/raindrop/{bookmark_id}
```

**Body**:
```json
{
  "tags": ["analyzed", "ghost-ai"]
}
```

### Get Collections

```
GET https://api.raindrop.io/rest/v1/collections
```

Returns all collections with metadata including item counts.

## jq Filtering Examples

### Get Untagged Bookmarks

```bash
jq -r '.items[] | select((.tags | length) == 0) | "\(._id)|\(.title)|\(.link)"'
```

### Get Bookmark Details

```bash
jq -r '.items[] | select(._id == {id}) | {id: ._id, title: .title, link: .link, tags: .tags}'
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `_id` | integer | Unique bookmark ID |
| `title` | string | Bookmark title |
| `link` | string | URL |
| `excerpt` | string | Auto-generated excerpt |
| `tags` | array | List of tags |
| `created` | string | ISO 8601 timestamp |
| `collectionId` | integer | Parent collection |
