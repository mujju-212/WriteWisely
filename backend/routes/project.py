"""
routes/project.py — Project Mode Routes (Document Editor)
CRUD documents + auto-save + AI enhancement
Now with intelligent writing assistance via ProjectAIEnhancer
"""

from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime

from config import get_db
from middleware.auth_middleware import get_current_user
from services.project_ai_enhancement import ProjectAIEnhancer
from services.llm_service import LLMService
from models.schemas import CreateProjectRequest, UpdateProjectRequest

router = APIRouter()


# ─── List Projects ────────────────────────────────────────────
@router.get("/list")
async def list_projects(user=Depends(get_current_user)):
    db = get_db()
    
    projects = await db.projects.find(
        {"user_id": user["id"]}
    ).sort("updated_at", -1).to_list(length=50)
    
    return {
        "projects": [
            {
                "id": str(p["_id"]),
                "title": p["title"],
                "doc_type": p.get("doc_type", "other"),
                "word_count": p.get("word_count", 0),
                "updated_at": p.get("updated_at", p.get("created_at")).isoformat()
            }
            for p in projects
        ]
    }


# ─── Create Project ───────────────────────────────────────────
@router.post("/create")
async def create_project(data: CreateProjectRequest, user=Depends(get_current_user)):
    db = get_db()
    
    project = {
        "user_id": user["id"],
        "title": data.title,
        "doc_type": data.doc_type,
        "content": "",
        "word_count": 0,
        "errors_history": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.projects.insert_one(project)
    
    return {"id": str(result.inserted_id), "message": "Project created!"}


# ─── Get Project ──────────────────────────────────────────────
@router.get("/{project_id}")
async def get_project(project_id: str, user=Depends(get_current_user)):
    db = get_db()
    
    project = await db.projects.find_one({
        "_id": ObjectId(project_id),
        "user_id": user["id"]
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "id": str(project["_id"]),
        "title": project["title"],
        "doc_type": project.get("doc_type", "other"),
        "content": project.get("content", ""),
        "word_count": project.get("word_count", 0),
        "created_at": project.get("created_at").isoformat(),
        "updated_at": project.get("updated_at").isoformat()
    }


# ─── Update Project (Auto-Save) ──────────────────────────────
@router.put("/{project_id}")
async def update_project(project_id: str, data: UpdateProjectRequest, user=Depends(get_current_user)):
    db = get_db()
    
    # Check ownership
    project = await db.projects.find_one({
        "_id": ObjectId(project_id),
        "user_id": user["id"]
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_fields = {
        "content": data.content,
        "word_count": len(data.content.split()),
        "updated_at": datetime.utcnow()
    }
    
    if data.title:
        update_fields["title"] = data.title
    
    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": update_fields}
    )
    
    return {"message": "Project saved!", "word_count": update_fields["word_count"]}


# ─── Delete Project ───────────────────────────────────────────
@router.delete("/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    db = get_db()
    
    result = await db.projects.delete_one({
        "_id": ObjectId(project_id),
        "user_id": user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project deleted!"}


# ─── Continue Writing (AI Enhancement) ──────────────────────────────────
@router.post("/{project_id}/continue")
async def continue_writing(project_id: str, user=Depends(get_current_user)):
    """Continue writing where the user left off"""
    db = get_db()
    
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": user["id"]
        })
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Use AI enhancement service
        llm_service = LLMService()
        enhancer = ProjectAIEnhancer(db, llm_service)
        
        continuation = await enhancer.continue_writing(
            text=project.get("content", ""),
            doc_type=project.get("doc_type", "other")
        )
        
        return {"continuation": continuation}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ─── Improve Paragraph (AI Enhancement) ─────────────────────────────────
@router.post("/{project_id}/improve")
async def improve_paragraph(project_id: str, paragraph: str, user=Depends(get_current_user)):
    """Improve a specific paragraph"""
    db = get_db()
    
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": user["id"]
        })
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        llm_service = LLMService()
        enhancer = ProjectAIEnhancer(db, llm_service)
        
        improved = await enhancer.improve_paragraph(paragraph)
        
        return {"improved_text": improved}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ─── Rewrite in Tone (AI Enhancement) ───────────────────────────────────
@router.post("/{project_id}/rewrite")
async def rewrite_in_tone(project_id: str, paragraph: str, tone: str, user=Depends(get_current_user)):
    """Rewrite text in a specific tone"""
    db = get_db()
    
    try:
        project = await db.projects.find_one({
            "_id": ObjectId(project_id),
            "user_id": user["id"]
        })
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        llm_service = LLMService()
        enhancer = ProjectAIEnhancer(db, llm_service)
        
        rewritten = await enhancer.rewrite_in_tone(paragraph, tone)
        
        return {"rewritten_text": rewritten}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
