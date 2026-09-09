from app.services.mrp_extractor import extract_mrp_from_text

sample = "MRP. ₹ 5/- (INCL. OF ALL TAXES)"

result = extract_mrp_from_text(sample)

print("\nMRP RESULT")
print(result)
