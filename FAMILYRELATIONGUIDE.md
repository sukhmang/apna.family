Here is a comprehensive `RELATIONSHIP_LOGIC.md` file. This document breaks down the complex Indian (specifically Punjabi/North Indian) relationship system versus the simplified English system, providing the exact logic your developer (or AI) needs to implement the dynamic toggle feature.

---

# Family Relationship Logic: Indian vs. English

**Purpose:** This document defines the logic required to calculate family relationships dynamically. The goal is to allow a user to select "Who am I?" (Root Node) and have the system automatically label every other node in the tree with the correct relationship relative to them.

## 1. The English System (Lineage-Based)

The English system is relatively simple and relies primarily on **generation distance** and **lineage**. It typically does not distinguish between paternal/maternal sides or relative age.

### Core Rules

1. **Direct Lineage:**
* **Generation +1:** Father, Mother
* **Generation +2:** Grandfather, Grandmother
* **Generation -1:** Son, Daughter
* **Generation -2:** Grandson, Granddaughter


2. **Siblings & Their Children:**
* **Same Generation:** Brother, Sister
* **Generation -1 (Sibling's child):** Nephew, Niece
* **Generation +1 (Parent's sibling):** Uncle, Aunt (No distinction between Mom's brother vs. Dad's brother)


3. **Cousins (The Confusion Point):**
* **1st Cousin:** Child of your Parent's Sibling (Share grandparents).
* **2nd Cousin:** Child of your Parent's Cousin (Share great-grandparents).
* **Removed:** Indicates a generation gap.
* *1st Cousin, once removed:* The child of your 1st cousin OR the parent of your 2nd cousin.





### Logic Table (English)

| Path from Root | Relationship Label |
| --- | --- |
| Parent | Father / Mother |
| Parent -> Parent | Grandfather / Grandmother |
| Sibling | Brother / Sister |
| Parent -> Sibling | Uncle / Aunt |
| Parent -> Sibling -> Spouse | Uncle / Aunt (In-law is implied but often omitted) |
| Parent -> Sibling -> Child | 1st Cousin |
| Sibling -> Child | Nephew / Niece |

---

## 2. The Indian System (Context-Based)

The Indian (specifically Punjabi/North Indian) system is highly granular. To calculate the correct label, the code must check four factors:

1. **Side:** Paternal (Dad's side) vs. Maternal (Mom's side).
2. **Gender:** The specific gender of the relative determines the suffix.
3. **Age (Crucial):** For Dad's brothers, we distinguish between *older* than Dad and *younger* than Dad.
4. **Marriage:** The spouse of a relative has a specific, unique title, not just "Aunt".

### A. Paternal Side (Dad's Family - *Dadke*)

| Relative | Condition | Title (Male) | Title (Female Spouse) |
| --- | --- | --- | --- |
| **Dad's Father/Mother** | Direct | **Baba ji** / Dada ji | **Babe** / Dadi ji |
| **Dad's Older Brother** | Older than Dad | **Taiya ji** | **Tai ji** |
| **Dad's Younger Brother** | Younger than Dad | **Chacha ji** | **Chachi ji** |
| **Dad's Sister** | Any age | **Phua** / Bhua ji | **Fufad ji** |

### B. Maternal Side (Mom's Family - *Nanke*)

| Relative | Condition | Title (Male) | Title (Female Spouse) |
| --- | --- | --- | --- |
| **Mom's Father/Mother** | Direct | **Nana ji** | **Nani ji** |
| **Mom's Brother** | Any age | **Mama ji** | **Mami ji** |
| **Mom's Sister** | Any age | **Maser ji** | **Masi** |

### C. Sibling Relationships (Your Generation)

| Relative | Condition | Title |
| --- | --- | --- |
| **Brother** | Older | **Veer** / Bhaji |
| **Sister** | Older | **Bhain** / Didi |
| **Brother's Wife** | Brother is Older | **Bhabhi** |
| **Sister's Husband** | Sister is Older | **Jija ji** |

### D. In-Laws (If You are Married) - *Sahure*

| Relative | Relationship | Title |
| --- | --- | --- |
| **Spouse's Father** | Father-in-law | **Bhapa ji** / Dad ji |
| **Spouse's Mother** | Mother-in-law | **Mummy ji** / Bebe |
| **Husband's Older Bro** | Brother-in-law | **Jeth** (Wife is *Jethani*) |
| **Husband's Younger Bro** | Brother-in-law | **Deor** (Wife is *Derani*) |
| **Husband's Sister** | Sister-in-law | **Nanad** (Husband is *Nandoiya*) |
| **Wife's Brother** | Brother-in-law | **Saala** (Wife is *Salheli*) |
| **Wife's Sister** | Sister-in-law | **Saali** (Husband is *Sandhu*) |

---

## 3. Algorithm Implementation Guide

To implement this dynamically in code (`getRelation(root, target)`), follow this decision tree:

**Step 1: Calculate the Path**
Find the shortest path in the graph from Root to Target.
*Example Path:* `Me -> Father -> Father (Grandfather) -> Sister (Aunt)`

**Step 2: Check "Side" (Maternal vs Paternal)**

* If first step is `Father` → **Paternal Logic**
* If first step is `Mother` → **Maternal Logic**

**Step 3: Apply Specific Logic**

* **Scenario 1: Dad's Brother**
* English: Just return "Uncle".
* Indian: Check `Target.dob` vs `Root.Father.dob`.
* If `Target.dob < Father.dob` (Older) → **Taiya**.
* If `Target.dob > Father.dob` (Younger) → **Chacha**.




* **Scenario 2: Mom's Brother**
* English: Just return "Uncle".
* Indian: Always **Mama** (Age doesn't change the title).


* **Scenario 3: Dad's Sister's Husband**
* English: Uncle.
* Indian: Identify path is `Father -> Sister`. That makes her `Phua`. Her spouse is `Fufad`.



## 4. Cheat Sheet Summary

| Relationship | English | Punjabi (Indian) |
| --- | --- | --- |
| Father's Older Brother | Uncle | **Taiya** |
| Father's Younger Brother | Uncle | **Chacha** |
| Mother's Brother | Uncle | **Mama** |
| Father's Sister | Aunt | **Phua** |
| Mother's Sister | Aunt | **Masi** |
| Brother's Wife | Sister-in-law | **Bhabhi** |
| Sister's Husband | Brother-in-law | **Jija** |