change the JSON file upload field to a field to send an api request to: https://api.edwinlovett.com/order?query={orderNumber}

To extract the orderNumber grab it from a Lumina Link 
User puts in Lumina link: https://townsquarelumina.com/lumina/view/order/67739fcd77ff89a87fc39608
Regex to remove 
- https://townsquarelumina.com/lumina/view/order/
- remove anything at the end like "?tab=line_items"
- https://townsquarelumina.com/lumina/view/order/67739fcd77ff89a87fc39608?tab=line_items

So the API request would be sent to: https://api.edwinlovett.com/order?query=67739fcd77ff89a87fc39608
It should be returned and added to the report just like the JSON upload

