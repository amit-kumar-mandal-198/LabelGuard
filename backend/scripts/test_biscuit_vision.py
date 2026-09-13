import json
import requests

with open("storage/uploads/68a4c627006f4bd887f9e1d902818438.jpeg", "rb") as f:
    files = {"file": ("biscuit.jpeg", f, "image/jpeg")}
    data = {
        "product_name": "Pineapple Cream Biscuits",
        "brand": "Vishal Mega Mart",
        "declared_mrp": 50.0,
    }
    r = requests.post("http://localhost:8000/api/v1/inspections/quick-scan", files=files, data=data)
    print("STATUS:", r.status_code)
    res = r.json()
    print("ID:", res.get("id"))
    print("Product:", res.get("productName"))
    print("Brand:", res.get("brand"))
    print("Status:", res.get("status"))
    print("Score:", res.get("complianceScore"))
    print("Declared MRP:", res.get("declaredMrp"))
    print("Tamper Detected:", res.get("tamperDetected"))
    tamper_msg = str(res.get("tamperReason")).encode("ascii", "replace").decode()
    print("Tamper Reason:", tamper_msg)
    print("Declarations:")
    for d in res.get("declarations", []):
        fn = d.get("fieldName")
        val = str(d.get("value")).encode("ascii", "replace").decode()
        bbox = d.get("bbox")
        print(f"  - {fn}: {val} | Box: {bbox}")
    print("Violations:")
    for v in res.get("violations", []):
        rt = v.get("ruleTitle")
        msg = str(v.get("message")).encode("ascii", "replace").decode()
        bbox = v.get("bbox")
        print(f"  - {rt}: {msg} | Box: {bbox}")


