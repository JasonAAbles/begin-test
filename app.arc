@app
begin-app

@http
get  /todos
post /todos
post /todos/delete
post /invoices-freshbooks/sanitize

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
